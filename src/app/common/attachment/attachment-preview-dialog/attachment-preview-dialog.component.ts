import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

import * as Croppie from 'croppie';

import { AttachmentService } from 'src/app/service/attachment.service';
import { Attachment } from 'src/app/class/attachment';

enum Status { PRESTINE, LOADING, LOADED, CROPPING, UPLOADING };

@Component({
  selector: 'app-attachment-preview-dialog',
  templateUrl: './attachment-preview-dialog.component.html',
  styleUrls: ['./attachment-preview-dialog.component.scss']
})
export class AttachmentPreviewDialogComponent implements OnDestroy, OnInit {
  private attachment: Attachment;
  private croppie: Croppie;
  private croppieOptions: Croppie.CroppieOptions;
  @ViewChild('imagePreviewContainer')
  private imagePreviewContainer: ElementRef;
  private status = Status.PRESTINE;
  uploadProgress: number = 0;

  constructor(
        private attachmentService: AttachmentService,
        @Inject(MAT_DIALOG_DATA) private currentFile: File,
        private dialogRef: MatDialogRef<AttachmentPreviewDialogComponent>) {
    // Opting for the popular 4:3 aspect ratio: 280x210
    this.croppieOptions = {
      viewport: { width: 280, height: 210 },
      boundary: { width: 300, height: 230 },
      showZoomer: false,
      enableOrientation: true
    };
  }

  ngOnInit(): void {
    this.dialogRef.afterOpened().subscribe((next) => {}, (error) => {}, () =>{
      this.croppie = new Croppie(this.imagePreviewContainer.nativeElement, this.croppieOptions);
      this.loadPreviewImage();
    });
  }

  ngOnDestroy(): void {
    this.croppie.destroy();
  }

  classActionsContainer(): string {
    return this.status >= Status.CROPPING ? 'mt-hide' : 'actions-container';
  }

  displayProgressBar(): boolean {
    return this.status >= Status.CROPPING;
  }

  private loadPreviewImage(): void {
    this.status = Status.LOADING;
    let fileReader = new FileReader();
    fileReader.onload = (progressEvent: Event) =>{
      const dataUrl: string = String(fileReader.result);
      this.croppie.bind({url: dataUrl, zoom: 0})
        .then(() => this.status = Status.LOADED)
        .catch(e => console.log('TODO: Catch-me!', e));
    };
    fileReader.readAsDataURL(this.currentFile);
  }

  onPreviewCrop(): void {
    if (this.status != Status.LOADED) {
      console.log('TODO Show message: No image to upload');
      return;
    }
    this.status = Status.CROPPING;

    // Opting for the popular 4:3 aspect ratio: 1600x1200
    this.croppie.result({
      type: 'blob',
      size: {width: 1600, height: 1200},
      format: 'jpeg',
      quality: .5,
      circle: false
    })
    .then(croppedBlob => {
      // TODO: Change type to canvas and do not resize small images
      this.status = Status.UPLOADING;
      const file = new File([croppedBlob], this.currentFile.name, {type: croppedBlob.type, lastModified: this.currentFile.lastModified});
      this.attachmentService.upload(file)
        .subscribe(next => {
          this.attachment = next.key;
          this.uploadProgress = next.value;
        }, 
        error => console.log('TODO send error message'),
        () => this.dialogRef.close(this.attachment));
      })
    .catch(e => console.log('TODO Send a message:', e));
  }
  
  onPreviewRotateClockWise(): void {
    if (this.status == Status.LOADED) {
      this.croppie.rotate(-90);
    }
  }

  onPreviewRotateCounterClockWise(): void {
    if (this.status == Status.LOADED) {
      this.croppie.rotate(90);
    }
  }
}
