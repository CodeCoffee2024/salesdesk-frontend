import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { SignatureType } from '../../core/models/public-document.model';

export interface SignatureValue {
  dataUrl: string;
  type: SignatureType;
  isEmpty: boolean;
}

/**
 * Captures a client's e-signature either by drawing on a canvas or by typing their
 * name in a cursive font (TASK-024). Both modes end up rendered onto the same
 * <canvas> and emitted as one PNG data URL — the acceptance modal, the audit
 * record and the final PDF all handle a signature as a single uniform image format
 * regardless of how it was produced, rather than branching on SignatureType.
 */
@Component({
  selector: 'app-signature-canvas',
  templateUrl: './signature-canvas.component.html',
  styleUrls: ['./signature-canvas.component.scss']
})
export class SignatureCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Output() signatureChange = new EventEmitter<SignatureValue>();

  mode: SignatureType = 'Drawn';
  typedName = '';

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private hasStroke = false;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#14192b';
    this.ctx = ctx;
  }

  setMode(mode: SignatureType): void {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;
    this.clear();
  }

  onPointerDown(event: PointerEvent): void {
    if (this.mode !== 'Drawn') {
      return;
    }
    this.drawing = true;
    const { x, y } = this.pointerPosition(event);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.mode !== 'Drawn' || !this.drawing) {
      return;
    }
    const { x, y } = this.pointerPosition(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.hasStroke = true;
  }

  onPointerUp(): void {
    if (this.mode !== 'Drawn' || !this.drawing) {
      return;
    }
    this.drawing = false;
    this.emitValue();
  }

  onTypedNameChange(value: string): void {
    this.typedName = value;
    this.renderTypedSignature();
    this.emitValue();
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasStroke = false;
    this.typedName = '';
    this.emitValue();
  }

  get isEmpty(): boolean {
    return this.mode === 'Drawn' ? !this.hasStroke : this.typedName.trim().length === 0;
  }

  private renderTypedSignature(): void {
    const canvas = this.canvasRef.nativeElement;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.typedName.trim()) {
      return;
    }

    this.ctx.save();
    this.ctx.font = `${Math.min(48, 320 / Math.max(this.typedName.length, 6))}px 'Dancing Script', cursive`;
    this.ctx.fillStyle = '#14192b';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.typedName.trim(), width / 2, height / 2);
    this.ctx.restore();
  }

  private emitValue(): void {
    const canvas = this.canvasRef.nativeElement;
    this.signatureChange.emit({
      dataUrl: canvas.toDataURL('image/png'),
      type: this.mode,
      isEmpty: this.isEmpty
    });
  }

  private pointerPosition(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
}
