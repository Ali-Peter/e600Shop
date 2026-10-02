import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-qty-stepper',
  templateUrl: './qty-stepper.html',
  styleUrl: './qty-stepper.css',
})
export class QtyStepper {
  readonly value = input(1);
  readonly min = input(1);
  readonly max = input(99);
  readonly label = input('Quantity');

  readonly valueChange = output<number>();

  decrease(): void {
    this.emit(this.value() - 1);
  }

  increase(): void {
    this.emit(this.value() + 1);
  }

  private emit(next: number): void {
    const clamped = Math.min(this.max(), Math.max(this.min(), next));
    if (clamped !== this.value()) {
      this.valueChange.emit(clamped);
    }
  }
}
