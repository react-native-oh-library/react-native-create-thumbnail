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
import fs, { ListFileOptions } from '@ohos.file.fs';

class FileUtil {
  
  getDirSize(cacheDir:string) {
    let bytesDeleted = 0;
    let filenames = this.getFileName(cacheDir)
    for (let i = 0; i < filenames.length; i++) {
      let imagePath = `${cacheDir}/${filenames[i]}`;
      bytesDeleted += fs.statSync(imagePath).size
    }
    return bytesDeleted;
  }

  getFileName(cacheDir:string) {
    let listFileOption: ListFileOptions = {
      recursion: false,
      listNum: 0,
      filter: {
        suffix: [".png", ".jpg", ".jpeg"],
        displayName: ["*abc", "efg*"]
      }
    }
    return fs.listFileSync(cacheDir,listFileOption)
  }

  cleanDir(cacheDir:string,bytes:number) {
    let bytesDeleted = 0;
    let filenames = this.getFileName(cacheDir)
    for (let i = 0; i < filenames.length; i++) {
      let imagePath = `${cacheDir}/${filenames[i]}`;
      bytesDeleted += fs.statSync(imagePath).size
      fs.unlink(imagePath)
      if(bytesDeleted >= bytes) {
        break;
      }
    }
  }
}

export const fileUtils = new FileUtil();