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

import { rcp } from '@kit.RemoteCommunicationKit';
import common from '@ohos.app.ability.common';

const TAG: string = 'RequestUpload';
import fs from '@ohos.file.fs';
import { BusinessError } from '@kit.BasicServicesKit';

export default class RequestDownload {
  private context: common.UIAbilityContext | undefined = undefined;

  constructor(context: common.UIAbilityContext) {
    this.context = context;
  }

  async downloadFile(folder: string, url: string, callback: (voidPath: string) => void) {
    let splitUrl = url.split('//')[1].split('/');
    const cacheVideoDir = `${this.context?.cacheDir}/${folder}`;
    const voidPath = `${cacheVideoDir}/${splitUrl[splitUrl.length-1]}`;
    if (!fs.accessSync(cacheVideoDir)) {
      fs.mkdirSync(cacheVideoDir);
    }
    if (fs.accessSync(voidPath)) {
      callback(voidPath)
      return
    }

    let downloadToFile: rcp.DownloadToFile = {
      kind: 'file',
      file: `${cacheVideoDir}/${splitUrl[splitUrl.length-1]}`,
      keepLocal: true
    } as rcp.DownloadToFile

    const securityConfig: rcp.SecurityConfiguration = {
      remoteValidation: "skip",
    };

    const session = rcp.createSession({ requestConfiguration: { security: securityConfig } });

    session.downloadToFile(url, downloadToFile).then((response) => {
      console.info(TAG, `Succeeded in getting the response`);
      callback(voidPath);
      session.close();
    }).catch((err: BusinessError) => {
      console.error(TAG, `DownloadToFile failed, the error message is ${JSON.stringify(err)}`);
      fs.unlink(voidPath)
      callback(null);
      session.close();
    });
  }
}