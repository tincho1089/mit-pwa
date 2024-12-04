export class WOStatus {
    constructor(
        public statusId: number,
        public quantity: number = 0,
        public selected: boolean = false
    ){}

    // get the bg color associated with the status
    public getBGStyle(): string {
        switch (this.statusId) {
            case 0:   { return 'bg-light-orange' }
            case 1:   { return 'bg-medium-blue' }
            case 2:   { return 'bg-medium-teal' }
            case 3:   { return 'bg-medium-red' }
            case 99:  { return 'bg-dark-blue' }
            case 100: { return 'bg-medium-gray' }
        }
        return ''
    }
    public getTextStyle(): string {
        switch (this.statusId) {
            case 0:   { return 'text-light-orange' }
            case 1:   { return 'text-medium-blue' }
            case 2:   { return 'text-medium-teal' }
            case 3:   { return 'text-medium-red' }
            case 99:  { return 'text-dark-blue' }
            case 100: { return 'text-medium-gray' }
        }
        return ''
    }

    public getStatusName (): string {
        switch (this.statusId) {
            case 0:   { return 'not started' }
            case 1:   { return 'in progress' }
            case 2:   { return 'completed' }
            case 3:   { return 'returned' }
            case 99:  { return 'submitted' }
            case 100: { return 'unassigned' }
        }
        return ''
    }
}