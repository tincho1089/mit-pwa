import { BaseInspection } from "../base-inspection";

// a shared class for the atg components for multiple inheritance
export abstract class BaseAtg extends BaseInspection {
    getDetailsForSummary(response:any)
    {
      try{
        if(response.answer)
        {
          let t = JSON.parse(response.answer);
          return t.details;
        }
        return null;
       
      }
        catch
        {
          return null;
        }
    }

    getMoreDetailsForSummary(response:any)
    {
      try
      {
        if (response.answer)
        {
          let t = JSON.parse(response.answer);

          let m = t.MoreDetails;
  
          if (!m)
          {
          return null;
          }
          return t.MoreDetails;
        }
        return null;
      }
      catch
      {
        return null;
      }
    }

    isNotNull(obj: any): boolean{
      return obj != null;
    }

    isArrayWithItems(obj: any): boolean {
      return Array.isArray(obj) && obj.length > 0;
    }

  }