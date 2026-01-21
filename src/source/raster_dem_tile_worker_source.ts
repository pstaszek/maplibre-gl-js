import {DEMData} from '../data/dem_data';
import {RGBAImage} from '../util/image';
import type {Actor} from '../util/actor';
import type {
    WorkerDEMTileParameters,
    TileParameters
} from './worker_source';
import {getImageData, isImageBitmap} from '../util/util';

export class RasterDEMTileWorkerSource {
    actor: Actor;
    loaded: {[_: string]: DEMData};

    constructor() {
        this.loaded = {};
    }

    async loadTile(params: WorkerDEMTileParameters): Promise<DEMData | null> {
        const {uid, encoding, rawImageData, redFactor, greenFactor, blueFactor, baseShift} = params;
        const width = rawImageData.width + 2;
        const height = rawImageData.height + 2;
        const imagePixels: RGBAImage | ImageData = isImageBitmap(rawImageData) ?
            new RGBAImage({width, height}, await getImageData(rawImageData, -1, -1, width, height)) :
            rawImageData;
        
        if (encoding === 'terrarium' && this.isEmpty(imagePixels)) {
            // This will cause the tile to enter the 'errored' state.
            throw new Error('DEM Tile is empty');
        }

        const dem = new DEMData(uid, imagePixels, encoding, redFactor, greenFactor, blueFactor, baseShift);
        this.loaded = this.loaded || {};
        this.loaded[uid] = dem;
        return dem;
    }

    removeTile(params: TileParameters) {
        const loaded = this.loaded,
            uid = params.uid;
        if (loaded && loaded[uid]) {
            delete loaded[uid];
        }
    }

    isEmpty(img: RGBAImage | ImageData): boolean {
        // Check if all pixels are 0
        const data = img.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) return false;
        }
        return true;
    }
}
