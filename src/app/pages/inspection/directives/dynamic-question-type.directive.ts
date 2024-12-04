import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[dynamicQuestionType]',
})

// Here is where the dynamic question types will be displayed
export class DynamicQuestionTypeDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
