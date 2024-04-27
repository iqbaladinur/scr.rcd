import Dexie, { Table } from 'dexie';
const DBNAME = 'RecordedVideosDB';
const DBVERSION = 1

export class videoStore extends Dexie {
  // 'videos' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  videos!: Table<VideoSaved>; 

  constructor() {
    super(DBNAME);
    this.version(DBVERSION).stores({
      videos: '++id, name, blob' // Primary key and indexed props
    });
  }
}

export const db = new videoStore();