import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EquipDetails, InspectionResponse, InspectionResponseImage } from 'src/app/core/sync/entities';

@Component({
  selector: 'summary-scroll',
  templateUrl: './summary-scroll.component.html',
  styleUrls: ['./summary-scroll.component.scss']
})
export class SummaryScrollComponent implements OnInit, OnDestroy {

  @Input() subSectionResponses: InspectionResponse[];
  @Input() summaryForm: FormGroup;
  @Input() equipDetails: EquipDetails[];
  @Input() inspectionImages: InspectionResponseImage[];

  newSubSectionResponses: InspectionResponse[] = [];
  batchSize: number = 4; // Number of inspections to load in each batch/scroll

  totalInspectionCount: number = 0; // Total Inspection that is already fetched
  fetchedInspectionCount: number = 0; // Counter to keep track of fetched inspections
  responseImagesMap: { [key: number]: any } = {};

  ngOnInit(): void {
    this.totalInspectionCount = this.subSectionResponses.length;
    this.fetchMoreData();
  }

  ngOnDestroy(): void {
    this.subSectionResponses = null;
    this.summaryForm = null;
    this.equipDetails = null;
    this.newSubSectionResponses = null;
    this.inspectionImages = null;
  }

  fetchMoreData() {
    if (this.fetchedInspectionCount < this.totalInspectionCount) { // Check if there are more inspections to fetch
      const remainingInspectionCount = this.totalInspectionCount - this.fetchedInspectionCount; 
      const inspectionsToFetch = Math.min(remainingInspectionCount, this.batchSize); // Calculate the number of inspections to fetch in this batch
      for (let i = 0; i < inspectionsToFetch; i++) {
        const response  = this.subSectionResponses[i + this.fetchedInspectionCount];
        this.responseImagesMap[response.id] = this.getResponseImages(response.id);
        this.newSubSectionResponses.push(response);
      }
      this.fetchedInspectionCount += inspectionsToFetch; // Update the fetched inspection count
    }
  }

  onScroll() {
    this.fetchMoreData();
  }

  getResponseImages(id: number) {
    return this.inspectionImages.filter(image => image.inspectionResponseId === id);
  }
}
