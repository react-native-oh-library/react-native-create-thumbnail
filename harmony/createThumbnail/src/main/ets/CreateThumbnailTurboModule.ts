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
import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM  } from '@rnoh/react-native-openharmony/generated/ts';
import Config from './model/Config';
import Thumbnail from './model/Thumbnail';
import { common } from '@kit.AbilityKit';
import fs from '@ohos.file.fs';
import { StringUtil } from './util/StringUtil';
import image from '@ohos.multimedia.image';
import util from '@ohos.util';
import media from '@ohos.multimedia.media';
import Url from '@ohos.url'
import fileUri from '@ohos.file.fileuri';
import RequestDownload from './download/RequestDownload';
import { fileUtils } from './util/FileUtil';


export class CreateThumbnailTurboModule extends TurboModule implements TM.CreateThumbnail.Spec{

  private context: common.UIAbilityContext = this.ctx.uiAbilityContext;
  private requestDownload:RequestDownload = new RequestDownload(this.context)

  async createThumbnail(config:Config): Promise<Thumbnail> {
    console.info('config ====' + JSON.stringify(config))
    const format = config.format ? config.format : "jpeg"
    const cacheDir = this.context.filesDir + '/thumbnails'
    //创建文件夹
    if(!fs.accessSync(cacheDir)) {
      fs.mkdirSync(cacheDir)
    }
    const cacheName = config.cacheName;
    if(!StringUtil.isNullOrEmpty(cacheName)) {
      let imagePath = `${cacheDir}/${cacheName}`;
      if(fs.accessSync(imagePath)) {
        const imageSource = image.createImageSource(imagePath);
        let decodingOptions = { editable: true, pixelFormat: 3}
        const pixelMap:image.PixelMap = await imageSource.createPixelMap(decodingOptions);
        let imageInfo = await pixelMap.getImageInfo();
        return this.parseThumbnail(imagePath,pixelMap,format,imageInfo);
      }
    }
    const filePath = config.url ? config.url : '';
    const dirSize = config.dirSize ? config.dirSize : 100;
    const timeStamp = config.timeStamp ? config.timeStamp: 0;
    const fileName = StringUtil.isNullOrEmpty(cacheName) ? ("thumb-" + util.generateRandomUUID(true)) : cacheName + "." + format;
    const imagePath = `${cacheDir}/${fileName}`;
    const file = fs.openSync(imagePath,fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
    
    const pixelMap = await this.getPixelMap(filePath,timeStamp);
    const imageInfo = await pixelMap.getImageInfo();
    const imagePackerApi: image.ImagePacker = image.createImagePacker();
    let packOpts =  { format: "image/jpeg", quality: 90 };
    if (format === 'png') {
      packOpts.format = "image/png";
      packOpts.quality = 100;
    } else {
      packOpts.format = "image/jpeg";
      packOpts.quality = 90;
    }
    const data = await imagePackerApi.packing(pixelMap,packOpts);
    let cacheDirSize  = dirSize * 1024 * 1024;
    let newSize = pixelMap.getPixelBytesNumber() + fileUtils.getDirSize(cacheDir);
    if (newSize > cacheDirSize) {
      fileUtils.cleanDir(cacheDir, cacheDirSize / 2);
    }
    fs.writeSync(file.fd,data);
    fs.closeSync(file);
    return this.parseThumbnail(imagePath,pixelMap,format,imageInfo);
  }

  parseThumbnail(imagePath:string,pixelMap:image.PixelMap,format:string,imageInfo:image.ImageInfo) {
    const thumbnail = new Thumbnail();
    thumbnail.path = fileUri.getUriFromPath(imagePath);
    thumbnail.size = pixelMap.getPixelBytesNumber();
    thumbnail.mime = "image/" + format;
    thumbnail.width = imageInfo.size.width;
    thumbnail.height = imageInfo.size.width;
    return thumbnail;
  }
  
  async downloadFile(filePath):Promise<string> {
    return new Promise((resolve)=> {
      this.requestDownload.downloadFile('videos',filePath,(voidPath: string) => {
         resolve(voidPath);
     });
    });
  }
  
  async getPixelMap(filePath:string,timeStamp:number):Promise<image.PixelMap> {
    let avImageGenerator: media.AVImageGenerator = await media.createAVImageGenerator();
    let urlObject = Url.URL.parseURL(filePath);
    if(urlObject.protocol === 'file:') {
      let fileUriObject = new fileUri.FileUri(filePath);
      let fdSrc = this.parseFdSrc(fileUriObject.path);
      avImageGenerator.fdSrc = fdSrc
    } else if(urlObject.protocol === 'http:' || urlObject.protocol === 'https:'){
      let voidPath = await this.downloadFile(filePath)
      if (!voidPath) {
        return Promise.reject('download fail')
      }
      let fdSrc = this.parseFdSrc(voidPath);
      avImageGenerator.fdSrc = fdSrc
    }
    let timeUs = timeStamp * 1000
    let queryOption = media.AVImageQueryOptions.AV_IMAGE_QUERY_NEXT_SYNC
    let param: media.PixelMapParams = {
      width : 300,
      height : 300
    }
    let pixelMap = await avImageGenerator.fetchFrameByTime(timeUs, queryOption, param)
    if(!pixelMap) {
      return Promise.reject("File doesn't exist or not supported")
    }
    avImageGenerator.release()
    return pixelMap
  }
  
  parseFdSrc(filePath:string): media.AVFileDescriptor{
    let file = fs.openSync(filePath, fs.OpenMode.READ_WRITE);
    let state = fs.statSync(filePath);
    let fb:media.AVFileDescriptor = {
      fd:file.fd,
      offset:0,
      length:state.size,
    }
    return fb;
  }
}

