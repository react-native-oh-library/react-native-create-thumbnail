/**
 * MIT License
 *
 * Copyright (C) 2024 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import request from '@ohos.request';
import media from '@ohos.multimedia.media';
import common from '@ohos.app.ability.common';
const TAG:string = 'RequestUpload';
import fs from '@ohos.file.fs';

export default class RequestDownload {

  private context: common.UIAbilityContext | undefined = undefined;
  private downloadTask: request.agent.Task | undefined = undefined;

  constructor(context:common.UIAbilityContext) {
    this.context = context;
  }

  async downloadFile(folder: string,url: string, callback: (voidPath: string) => void){
        // 查询到存在正在执行的下载任务，提示并返回
    let tasks = await request.agent.search({
      state: request.agent.State.RUNNING,
      action: request.agent.Action.DOWNLOAD,
      mode: request.agent.Mode.FOREGROUND
    });
    if(tasks.length> 0) {
      return
    };
    let splitUrl = url.split('//')[1].split('/');
    const cacheVideoDir = `${this.context?.cacheDir}/${folder}`;
    const voidPath = `${cacheVideoDir}/${splitUrl[splitUrl.length-1]}`;
    if(!fs.accessSync(cacheVideoDir)) {
      fs.mkdirSync(cacheVideoDir);
    };
    if(fs.accessSync(voidPath)) {
      callback(voidPath)
      return
    }
    let downloadConfig: request.agent.Config = {
      action: request.agent.Action.DOWNLOAD,
      url: url,
      title: 'download',
      mode: request.agent.Mode.FOREGROUND,
      network: request.agent.Network.ANY,
      saveas: `./${folder}/${splitUrl[splitUrl.length-1]}`,
      overwrite: true
    };
    console.info(TAG, `downloadFile, downloadConfig = ${JSON.stringify(downloadConfig)}`);
    try {
      this.downloadTask = await request.agent.create(this.context, downloadConfig);
      this.downloadTask.on('completed', (progress: request.agent.Progress) => {
        console.info(TAG, `download complete, file= ${url}, progress = ${progress.processed}`);
        callback(voidPath);
        this.deleteTask();
      })
      this.downloadTask.on('failed', async (progress: request.agent.Progress) => {
        if (this.downloadTask) {
          let taskInfo = await request.agent.show(this.downloadTask.tid);
          console.info(TAG, `fail,  resean = ${taskInfo.reason}, faults = ${JSON.stringify(taskInfo.faults)}`);
        }
        fs.unlink(voidPath)
        callback(null);
        this.deleteTask();
      })
      await this.downloadTask.start();
    } catch (err) {
      callback(null);
      fs.unlink(voidPath)
      console.error(TAG, `task  err, err  = ${JSON.stringify(err)}`);
    }
  }

  async deleteTask() {
    if(this.downloadTask) {
      this.downloadTask.off('completed');
      this.downloadTask.off('failed');
      await request.agent.remove(this.downloadTask.tid);
    }
    this.downloadTask = undefined;
  }
}