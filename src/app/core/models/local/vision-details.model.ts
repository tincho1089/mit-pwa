/**
 * vision detail model to transpile into database entities
 * @param FieldName - field name for Vision Detail
 * @param DisplayName - display name for vision detail
 * @param Type - type of vision detai, it could be text, number, gps, dropdown, link
 * @param Value - current value for vision detail
 * @param NewValue - updated value for vision detail when value is null or its editable
 * @param Section - section for grouping vision details
 * @param Units - units for vision detail when its a numeric type
 * @param Options - options for vision detail when its a dropdown type
 */
 export class VisionDetailsModel {
  constructor(
    public FieldName: string,
    public DisplayName: string,
    public Type: string,
    public Value: string,
    public NewValue: string = null,
    public Section: string = null,
    public Unit: string = null,
    public Options: string = null
  ) {}
}
