import { FormGroup } from '@angular/forms';
import { InspectionResponse, EquipDetails } from '../../sync/entities';

export interface QuestionTypesModel {
  response: InspectionResponse;
  form: FormGroup<any>;
  section: string;
  showHelper: boolean;
  showControl: boolean;
  editable?: boolean;
  showQuestionTitle: boolean;
  triggerShowHelper?: any;
  equipDetails?:  EquipDetails[];
}
