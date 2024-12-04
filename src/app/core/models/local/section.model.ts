import { SubSectionModel } from './subsection.model';

export class SectionModel {
  constructor(
    public title: string,
    public subSections: Array<SubSectionModel> = new Array<SubSectionModel>(),
    public status: boolean = false
  ) {}

  public get isShow(): boolean {
    let result: boolean = true;

    if (this.subSections) {
      result = this.subSections.some((item) => {
        const containsInspectionsToShow: boolean =
          item.responses &&
          !!item.responses.find((inspection) => inspection.isShow);
        return containsInspectionsToShow;
      });
    }

    return result;
  }

  public getMaxSubSectionSortId(): number {
    let subSectionSortIds : Array<number> = [].concat.apply([], this.subSections.map(sub => sub.responses.map(item => { return item.subSectionSortId; }) ));
    let maxSubSectionSortID : number = Math.max.apply(Math, subSectionSortIds);
    return maxSubSectionSortID;
  }
}
