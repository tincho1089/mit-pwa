import { Injectable } from "@angular/core";
import packageJson from '../../../package.json';
import { QUESTIONTYPES } from "../core/enums/question-types.enum";

@Injectable()
export class MIUtilities {
  constructor() { }

  static getDeviceInfo(): string{
    return "deviceName=pwa" +
    "&appVersion=" + packageJson.version +
    "&OSVersion=" + encodeURI(window.navigator.userAgent);
  }

  static isNullOrUndefined(obj: any) {
    if (
      !obj ||
      obj === "" ||
      obj === "undefined" ||
      obj === null ||
      obj === "null"
    ) {
      return true;
    }
    return false;
  }

  static stringHasValue(value: string) : boolean {
    let hasValue = (value !== undefined && value !== null && value.trim().length > 0);
    return hasValue;
  }

  //This function is to know if any of the answer, answer details, AsFound, AsLeft, rows are null or undefined
  static isAnsDetailNullOrUndefined(
    answer: any,
    hasDetails: boolean,
    asFOrL: string,
    rowNum: number
  ) {
    let flag: boolean;
    let asFOrLObj = null;
    if (this.isNullOrUndefinedObject(answer) || answer.length === 0) {
      flag = true;
    } else if (hasDetails) {
      if (this.isNullOrUndefinedObject(answer.details)) {
        flag = true;
      } else if (!this.isNullOrUndefined(asFOrL)) {
        if (asFOrL === "F") {
          asFOrLObj = answer.details.AsFound;
        } else {
          asFOrLObj = answer.details.AsLeft;
        }
        if (this.isNullOrUndefinedObject(asFOrLObj)) {
          flag = true;
        } else if (this.isNullOrUndefinedObject(asFOrLObj)[rowNum]) {
          flag = true;
        } else {
          flag = false;
        }
      }
    } else {
      flag = false;
    }
    return flag;
  }
  static b64ServerUpload(img: string) {
    // format the base 64 into something the server accepts
    if (img) {
      const imgSplit = img.split('base64,');
      if (imgSplit.length == 2) 
        img = imgSplit[1];
    }
    return img;
  }

  static getFormUrlEncoded(toConvert: any) {
    const formBody = [];
    for (const property in toConvert) {
      const encodedKey = encodeURIComponent(property);
      const encodedValue = encodeURIComponent(toConvert[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    return formBody.join("&");
  }

  static superEncodeURI(url) {

    var encodedStr = '', encodeChars = ["(", ")"];
    url = encodeURI(url);
  
    for(var i = 0, len = url.length; i < len; i++) {
      if (encodeChars.indexOf(url[i]) >= 0) {
          var hex = parseInt(url.charCodeAt(i)).toString(16);
          encodedStr += '%' + hex;
      }
      else {
          encodedStr += url[i];
      }
    }
  
    return encodedStr;
  }

  static getEnumKeyByValue(value) {
    return Object.keys(QUESTIONTYPES).find(
      key => QUESTIONTYPES[key] === value
    );
  }

  //#region  unused methods
  getRandomUniqueString(strPrefix: string) {
    return (
      strPrefix +
      Math.random()
        .toString(36)
        .substr(2, 9)
    );
  }

  onlyNumberKey(event) {
    return event.charCode === 8 || event.charCode === 0
      ? null
      : event.charCode >= 48 && event.charCode <= 57;
  }

  onlyDecimalNumberKey(event) {
    let charCode = event.which ? event.which : event.keyCode;
    if (charCode !== 46 && charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    return true;
  }

  convertSAPDateToDate(unformatedDate: string): any {
    let regEx = new RegExp(/\((.*?)\)/g);
    let result = regEx.exec(unformatedDate);
    return result ? new Date(+result[1]) : null;
  }

  static isNullOrUndefinedObject(obj: any) {
    if (obj === null || obj === undefined) {
      return true;
    }
    return false;
  }

  static getRespValidationResult(result): string {
    let msg: string = null;
    let nextItem: boolean = true;
    let resultArr: Array<any> = [];
    if (!this.isNullOrUndefinedObject(result)) {
      if (Array.isArray(result)) {
        resultArr = result;
      } else {
        resultArr.push(result);
      }
      resultArr.forEach(res => {
        if (nextItem) {
          //console.log("getRespValidationResult>>RES>>>"+JSON.stringify(res));
          if (res.httpStatusCode == 200) {
            console.log("INSIDE 200 STATUS>>>>");
            //if (!this.isNullOrUndefinedObject(res)){
            if (
              !this.isNullOrUndefined(res.Message) &&
              res.Message.length > 0
            ) {
              msg = res.Message;
              nextItem = false;
            }
            if (
              !this.isNullOrUndefined(res.MessageDetail) &&
              res.MessageDetail.length > 0
            ) {
              msg =
                msg === null
                  ? res.MessageDetail
                  : msg + "<br/><b>Detailed message is " + res.MessageDetail + "</b>";
              nextItem = false;
            }
            if (
              !this.isNullOrUndefined(res.error) &&
              res.error.length > 0 &&
              (this.isNullOrUndefined(msg) || msg.length === 0)
            ) {
              msg =
                msg === null
                  ? res.error
                  : msg + "<br/><b>Detailed message is " + res.error + "</b>";
              nextItem = false;
            }
            //}
          } else {
            if (
              !this.isNullOrUndefined(res.Message) &&
              res.Message.length > 0
            ) {
              msg = res.Message;
              nextItem = false;
            }
            if (!this.isNullOrUndefined(res.error) && res.error.length > 0) {
              msg =
                msg === null
                  ? res.error
                  : msg + "<br/><b>Detailed message is " + res.error + "</b>";
              nextItem = false;
            } else if(!this.isNullOrUndefinedObject(res.Message) && !this.isNullOrUndefined(res.Message.error) && res.Message.error.length > 0){
              msg =
                msg === null
                  ? res.Message.error
                  : msg + "<br/><b>Detailed message is " + res.Message.error + "</b>";
              nextItem = false;
            }
            if (!MIUtilities.isNullOrUndefined(res.httpStatusCode)) {
              msg =
                msg === null
                  ? "Error code from the API response is " + res.httpStatusCode
                  : msg +
                  ".Error code from the API response is " +
                  res.httpStatusCode;
              nextItem = false;
            } else if (typeof res === "string") {
              msg = msg === null ? res : msg + res;
            }
          }
        }
      });
    }
    return msg;
  }

  static setImgHeightAndWidth(obj, b64) {
    const image = new Image();
    image.setAttribute("crossOrigin", "anonymous");
    image.src = b64;

    image.onload = event => {
      const iw = image.width;
      const ih = image.height;
      console.log("IMAGE WIDTH>>>" + iw);
      console.log("IMAGE HEIGHT>>>" + ih);
      const maxW = iw > window.outerWidth - 32 ? window.outerWidth - 32 : iw;
      const maxH =
        ih > window.outerHeight - 250 ? window.outerHeight - 250 : ih;
      console.log("MAXW>>>" + maxW);
      console.log("MAXH>>>" + maxH);
      const scale = Math.min(maxW / iw, maxH / ih);
      const iwScaled = iw * scale;
      const ihScaled = ih * scale;
      console.log(
        "| maxW: " +
        maxW +
        " | maxH: " +
        maxH +
        " | iw: " +
        iw +
        " | ih: " +
        ih +
        " | scale: " +
        scale +
        " | iwScaled: " +
        iwScaled +
        " | ihScaled: " +
        ihScaled +
        " |"
      );
      obj.imgWidth = iwScaled + "";
      obj.imgHeight = ihScaled + "";
    }
  };

  static isBalanced(string) {
    let parentheses: string = "[]{}()";
    let stack = [];
    let i: number;
    let character;
    let bracePosition: number;

    for (i = 0; character = string[i]; i++) {
      bracePosition = parentheses.indexOf(character);

      if (bracePosition === -1) {
        continue;
      }

      if (bracePosition % 2 === 0) {
        stack.push(bracePosition + 1); // push next expected brace position
      } else {
        if (stack.length === 0 || stack.pop() !== bracePosition) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }

  static leftPad(num: number, size: number): string {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  }

  static rightPad(num: number, size: number): string {
    console.log("rightpad>>"+num);
    let s = num + "";
    while (s.length < size) s = s + "0";
    return s;
  }

  static getNumberOfDecimals(s:string):number{
    let dotIndex: number;
    if (!this.isNullOrUndefined(s)) {
      dotIndex = s.indexOf(".");
      if (dotIndex > 0) {
        console.log("getNumberOfDecimals>>"+(s.length - (dotIndex+1)));
        return s.length - (dotIndex+1);
      }
    }
    console.log("getNumberOfDecimals>>"+0);
    return 0;
  }

  static getNextIncrement(s: string) {
    let dotIndex: number;
    let num: number;
    let result: string = "1";
    if (!this.isNullOrUndefined(s)) {
      dotIndex = s.indexOf(".");
      if (dotIndex > 0) {
        num = s.length - (dotIndex+1);
        result = "." + this.leftPad(1, num);
      }
    }
    console.log("getNextIncrement>>" + result);
    return result == "1" ? "01" : result;
  }

  static getNextIncrementOnWholeNumber(s: string, decimals: number){
    let finalWholeNumber: string;
    let finalFractionalNumber: number;
    let fractionalNumber :number;
    let dotIndex: number;
    let increment:number = (Number)(this.getNextIncrement(s).replace(".", ""));
    let finalNumber: string = "1";

    if (!this.isNullOrUndefined(s)) {
      dotIndex = s.indexOf(".");
      if (dotIndex > 0) {
        finalWholeNumber = s.substring(0, dotIndex);
        fractionalNumber = (Number)(s.substring(dotIndex + 1));
        finalFractionalNumber = fractionalNumber + increment;
        
        // check when increasing digits in fractional number. Eg. 9 to 10 --> 2.9 to 2.10
        if (finalFractionalNumber.toString().length > fractionalNumber.toString().length) {
          decimals ++; 
        }
        finalNumber = finalWholeNumber + "." + finalFractionalNumber.toLocaleString('en-US', { minimumIntegerDigits: decimals, useGrouping: false });
      }
    }
    return finalNumber;
  }

  static displaySection(section) {
    let foundInspection = false;
    if (section && section.subSections) {
      section.subSections.forEach(subsection => {
        if (!foundInspection) {
          foundInspection = this.displaySubSection(subsection);
        }
      })
    } else {
      return true;
    }
    return foundInspection;
  }

  static displaySubSection(subsection) {
    return subsection.responses && !!subsection.responses.find(i => i.isShow === true);
  }

  static parseDynamicNumericString(numericString: string): number {
    const floatValue  = parseFloat(numericString);
    if (!isNaN(floatValue)) {
      return floatValue; // Numeric string has decimal values
    }
  
    const intValue = parseInt(numericString, 10);
    if (!isNaN(intValue)) {
      return intValue; // Numeric string is an integer
    }
  
    throw new Error(`Invalid numeric string: ${numericString}`);
  }

  static filterArrayDuplicates(arr:any[]) {
    let outputArray = arr.filter(function (v, i, self) {
        return i == self.indexOf(v);
    });
    return outputArray;
}

static base64toBlob(b64Data: string, contentType: string, sliceSize: number = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

static standardiseStr(str : string | null): string {
  return str ? str.trim().toUpperCase() : '';
}

static isZero(val){
  return val == 0 || val == "0";
}
  //#endregion
}
