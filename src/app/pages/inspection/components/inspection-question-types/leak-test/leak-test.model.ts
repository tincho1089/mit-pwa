export class LeakTestModel {
  constructor(
    public value: string,
    public description: string,
    public stacked = null
  ) {}
}
