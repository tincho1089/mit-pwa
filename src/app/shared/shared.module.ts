import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from './modules/material.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll'

@NgModule({
  imports: [CommonModule, MaterialModule, FormsModule, InfiniteScrollModule],
  declarations: [

  ],
  exports: [CommonModule, FormsModule, MaterialModule, InfiniteScrollModule],
  providers: [
    // nothing here
  ],
})
export class SharedModule { }
