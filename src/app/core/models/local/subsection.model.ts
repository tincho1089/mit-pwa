import { InspectionResponse } from '../../sync/entities';

export class SubSectionModel {
  constructor(
    public title: string,
    public responses: Array<InspectionResponse> = new Array<InspectionResponse>(),
    public isShow: boolean = false
  ) {}
}
