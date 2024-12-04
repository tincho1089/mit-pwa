export class DomainModel {
    constructor(public value: string = null, public description: string = null, public passFail: string = null) {
      if (description === null) this.description = value;
    }

    static parseOptions(
      options: string,
      value: string,
      description = null
    ): DomainModel[] {
      let domains: DomainModel[] = [];
      try {
        if (options) {
          if (description === null) description = value;
          let obj = JSON.parse(options);
          obj.forEach(e => {
            domains.push(new DomainModel(e[value], e[description]));
          });
        }
      } catch {}
      return domains;
    }

    static parseOptionsPassFail(
      options: string,
      value: string,
      description = null, 
      passFail: string
    ): DomainModel[] {
      let domains: DomainModel[] = [];
      try {
        if (options) {
          if (description === null) description = value;
          let obj = JSON.parse(options);
          obj.forEach(e => {
            domains.push(new DomainModel(e[value], e[description], e[passFail]));
          });
        }
      } catch {}
      return domains;
    }
  
    static parseDetails(details: string, value: string, description = null) {
      if (description === null) description = value;
      let obj = JSON.parse(details);
      let domains: DomainModel[] = [];
      obj.details.forEach(e => {
        domains.push(new DomainModel(String(e[value]), String(e[description])));
      });
      return domains;
    }
}

