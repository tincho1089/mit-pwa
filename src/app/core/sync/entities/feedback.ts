import * as dayjs from 'dayjs'

export interface IFeedback { 
    ai_id: number; //auto generated id
    category: string;
    text: string;
    postDate: string;
}

export class Feedback implements IFeedback{
    ai_id: number;
    category: string;
    text: string = "";
    postDate: string;
    additionalProperties: string = '{}';

    constructor(
        ai_id: number, 
        category: string, 
        text: string, 
        additionalProperties: string
    ){
        this.ai_id = ai_id;
        this.category = category;
        this.text = text;
        this.postDate = dayjs().format('YYYY-MM-DDTHH:mm:ss');
        this.additionalProperties = additionalProperties;
    }
}