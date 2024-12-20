/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */
import { TurboModuleRegistry, RootTag } from 'react-native';
import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';

/**
 * Codegen restriction: All TypeScript interfaces extending TurboModule must be called 'Spec'.
 */

export interface Config {
  url: string;
  timeStamp?: number;
  format?: "jpeg" | "png";
  dirSize?: number;
  headers?: Object;
  cacheName?: string;
}

export interface Thumbnail {
  path: string;
  size: number;
  mime: string;
  width: number;
  height: number;
}

export interface Spec extends TurboModule {
  createThumbnail(config:Config): Promise<Thumbnail>;
}

export default TurboModuleRegistry.get<Spec>('CreateThumbnail')!;
