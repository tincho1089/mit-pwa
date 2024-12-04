export class MeridiumModel {
    constructor(
      public description: string = "",
      public value: string = "",
      public showComment = false,
      public commentRequired = false,
      public showRecommendations = false,
      public isShowPhoto = true
    ) {}
  }