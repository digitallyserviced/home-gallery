export interface Entry {
  id: string
  shortId: string
  type: string
  date: string
  year: number
  width: number
  height: number
  latitude: number
  longitude: number
  tags: string[]
  appliedEventIds?: string[],
  textCache?: string | false
  similarityHash: string
  similarity:number
  colorDistance:number
  vibrance:any[]
overlayText:string
  faces?: any[],
}
