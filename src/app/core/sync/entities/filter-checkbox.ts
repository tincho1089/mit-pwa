import { WorkOrderList } from "./work-order-list";

export interface IFilterCheckbox {
  current: Array<WorkOrderList>;
  all: Array<WorkOrderList>;
  filter: string[];
  str: string;
  type: string;
}

export class FilterCheckbox implements IFilterCheckbox {
  current: Array<WorkOrderList>;
  all: Array<WorkOrderList>;
  filter: string[];
  str: string;
  type: string;

  constructor(type: string){
    this.current = [];
    this.all = [];
    this.filter = [];
    this.str = '';
    this.type = type;
  }

  public setDistinctOptions(allFilterOptions: WorkOrderList[]) {
    this.all = allFilterOptions.filter((wo, index) => allFilterOptions.findIndex(obj => (obj[this.type] === wo[this.type]) && (obj[this.type] != "")) === index);
    this.current = this.all;
  }

  public setFilter(wo: WorkOrderList) {
    let index = this.filter.indexOf(wo[this.type], 0);
    if (index > -1) //if exists in array aka checked, uncheck
    {
      this.filter.splice(index, 1);
    }
    else{ //add to array aka check
      this.filter.push(wo[this.type].toString());
    }
  }

  public clear() {
    this.current = [];
    this.current = this.all;
    this.str = '';
    this.filter = [];
  }

  public isFiltering() : boolean {
    return this.filter.length != 0;
  }

  public refineFilter() {
    this.current = this.all.filter((wo) => wo[this.type].toLowerCase().includes(this.str.toLowerCase()));
  }
}