import { MIUtilities } from 'src/app/shared/utility';
import { InspectionResponseImage } from './inspection-response-image';

export interface IInspectionResponse {
  ai_id: number; //auto generated id
  id: number;
  inspectionId: number;
  inspectionImages: Array<InspectionResponseImage>;
}

export class InspectionResponse implements IInspectionResponse {
  ai_id: number;
  id: number;
  inspectionId: number;
  answer: string;
  inspectionSection: string;
  subsection: string;
  comments: string;
  recommendation: string;
  conditionId: string;
  questionId: string;
  question: string;
  attention: boolean;
  feedbackComment: string;
  finalRecommendation: string;
  conditionComment: string;
  options: string;
  itemType: number;
  conditions: string;
  conditionalExpression: string;
  isChanged: string;
  isNA: boolean;
  createdBy: string;
  createdDate: string;
  displayComments: boolean;
  displayFollowUpWorkOrder: boolean;
  followUpWO: boolean;
  displayImmediateAttentionRequired: boolean;
  units: string;
  displayNA: boolean;
  displayPhoto: boolean;
  displayCopy: boolean;
  circuitPiping: string;
  questionImage: string;
  sortId: number;
  sectionSortId: number;
  subSectionSortId: number;
  actionMsg: string;
  subCopy: boolean;
  isShow: boolean = true;
  dependencyError: boolean = false;
  inspectionImages: InspectionResponseImage[];
  showHelper: boolean;
  showComment: boolean;
  isCommentRequired: boolean;
  showRecommendation: boolean;
  showPhoto: boolean;

  init(inspectionId: number, jsonArray: any): Array<InspectionResponse> {
    const image: InspectionResponseImage = new InspectionResponseImage();
    const transformedResponses = jsonArray?.map((json) => {
      try {
        return {
          id: json['ID'],
          sortId: json['ItemSortID'],
          sectionSortId: json['SectionSortID'],
          subSectionSortId: json['SubSectionSortID'],
          inspectionId: json['InspectionWorkOrderId'],
          answer: json['Answer'],
          inspectionSection: json['InspectionSection'],
          subsection:
            json['InspectionItemSubsection'] != 'null'
              ? json['InspectionItemSubsection']
              : null,
          comments: json['Comments'],
          recommendation: json['Recommendation'],
          conditionId: json['conditionId'],
          questionId: json['InspectionItemCode'],
          question: json['InspectionItemDescription']?.replace(/\n/gi, '<br/>'),
          attention: JSON.parse(json['IsImmediateAttentionRequired']),
          feedbackComment: json['FeedbackComment'],
          finalRecommendation: json['FinalRecommendation'],
          conditionComment:
            json['ConditionComments'] != 'null'
              ? json['ConditionComments']
              : null,
          options: json['InspectionItemOptions'],
          itemType: json['InspectionItemType'],
          conditions: json['InspectionItemConditions'],
          conditionalExpression: json['ConditionalExpression'],
          isChanged: 'N',
          isNA: (JSON.parse(json['DisplayNA']) && json['Answer']=='NA'), //attempt to interpret if na selected
          isShow: true,
          createdBy: json['CreatedBy'],
          createdDate: json['CreatedDate'],
          displayComments: JSON.parse(json['DisplayComments']),
          displayFollowUpWorkOrder: JSON.parse(json['DisplayFollowUpWO']),
          followUpWO: JSON.parse(json['FollowUpWO']),
          displayImmediateAttentionRequired: JSON.parse(
            json['DisplayImmediateAttentionRequired']
          ),
          units: json['Units'],
          displayNA: JSON.parse(json['DisplayNA']),
          displayPhoto: JSON.parse(json['DisplayPhoto']),
          displayCopy: JSON.parse(json['DisplayCopy']),
          circuitPiping: MIUtilities.isNullOrUndefined(json['CircuitPiping'])
            ? ''
            : JSON.parse(json['CircuitPiping']),
          questionImage: json['QuestionImage'],
          subCopy: json['SubsectionCopy'],
          inspectionImages: image.init(
            json['InspectionWorkOrderId'],
            json['InspectionItemCode'],
            json['Images']
          ),
        };
      } catch (e) {
        console.log('ERROR>>RESPONSE>>>' + e + ' for ' + inspectionId);
        return null;
      }
    });
    return transformedResponses;
  }

  static rewriteConditionalExpression(
    response: InspectionResponse,
    responsesList: any[]
  ): string {

    const conditions = response.conditionalExpression
    .split(/(&&|\|\|)/);
    
    const newConditions: string[] = [];
    
    for (let condition of conditions) {
      if(condition == '&&' || condition == '||'){
        newConditions.push(condition);
      }
      else{
        let rewriteCondition = this.rewrite(condition, responsesList);

        // conditional question id replaced by conditional saved answer
        const conditionalSavedAnswer = rewriteCondition.splitedContidion[0].replace(rewriteCondition.questionId, `'${rewriteCondition.savedAnswer}'`);
        // conditional answer with ''
        const conditionalAnswer = rewriteCondition.splitedContidion[1].toLowerCase().replace(rewriteCondition.conditionAnswer, `'${rewriteCondition.conditionAnswer}'`);

        newConditions.push(`${conditionalSavedAnswer}==${conditionalAnswer}`);
      }
    }
    
    return newConditions.join('');
  }

  static evalConditionalExpression(
    response: InspectionResponse,
    responsesList: any[]
  ):boolean {
    try {
      const exp = InspectionResponse.rewriteConditionalExpression(response,responsesList);
      return Boolean(eval(exp));
    } catch(e) {
      console.error(`[InspectionResponse] Failed to evaluate conditional expression for question: ${response.questionId}`);
      console.error(e);
      response.dependencyError = true;
      return true;
    }
  }

  static rewrite(
    condition: string,
    responsesList: any[]
  ): any {
    let newCondition = 'true';
    let inspectionSaved = null;
    let savedAnswer = null;
    let conditionAnswer = null;
    const element = condition.split('=');
    let questionid: string = !!element[0] ? element[0].trim() : '';
    while (
      questionid != null &&
      questionid.startsWith('(') &&
      !MIUtilities.isBalanced(questionid)
    ) {
      questionid = questionid.substring(1);
    }
    let answer: string = !!element[1] ? element[1].trim() : '';
    while (
      answer != null &&
      answer.endsWith(')') &&
      !MIUtilities.isBalanced(answer)
    ) {
      answer = answer.substring(0, answer.length - 1);
    }
    inspectionSaved = responsesList.find(
      (iresponse) => iresponse['questionId'] == questionid.trim()
    );

    savedAnswer =
      inspectionSaved && inspectionSaved.answer
        ? inspectionSaved.answer.toLowerCase().trim()
        : null;
    conditionAnswer = answer ? answer.toLowerCase().trim() : null;
    newCondition = "'" + savedAnswer + "'=='" + conditionAnswer + "'";
    return { questionId : questionid, conditionAnswer : conditionAnswer, savedAnswer : savedAnswer, newCondition : newCondition, splitedContidion: element};
  }
}
