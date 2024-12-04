export interface IUser {
    ID: number;
    FirstName: string;
    LastName: string;
    IsDeleted: boolean;
    Type: number; // 1==Inspector || 2==Sysadmin
    Email: string;
    FullName: string;
    CreatedDate: string;
    UpdatedDate: string;
    BUDescription: string;
    OnlineSearchEnabled: boolean;
    LastLoginDate: string;
}

export class User implements IUser {
    ID: number;
    FirstName: string;
    LastName: string;
    IsDeleted: boolean;
    Type: number;
    Email: string;
    FullName: string;
    CreatedDate: string;
    UpdatedDate: string;
    BUDescription: string;
    OnlineSearchEnabled: boolean;
    LastLoginDate: string;
    Role: string;

    constructor(
        userObj: any
    ){
        this.ID = userObj?.ID;
        this.FirstName = userObj?.FirstName;
        this.LastName = userObj?.LastName;
        this.IsDeleted = userObj?.IsDeleted;
        this.Type = userObj?.Type;
        this.Email = userObj?.Email;
        this.FullName = userObj?.FullName;
        this.CreatedDate = userObj?.CreatedDate;
        this.UpdatedDate = userObj?.UpdatedDate;
        this.BUDescription = userObj?.BUDescription;
        this.OnlineSearchEnabled = userObj?.OnlineSearchEnabled;
        this.LastLoginDate = userObj?.LastLoginDate;
        if (userObj?.Type == 1) this.Role = 'Inspector';
        else if (userObj?.Type == 2) this.Role = 'SysAdmin';
    }
}