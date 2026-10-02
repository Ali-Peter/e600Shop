import { TestBed } from '@angular/core/testing';
import { UserAvatar } from './user-avatar';

describe('UserAvatar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UserAvatar] }).compileComponents();
  });

  function render(options: { src?: string | null; name?: string | null } = {}) {
    const fixture = TestBed.createComponent(UserAvatar);
    fixture.componentRef.setInput('src', options.src ?? null);
    fixture.componentRef.setInput('name', options.name ?? null);
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    return { fixture, native };
  }

  it('renders the profile picture when a URL is available', () => {
    const { native } = render({ src: 'https://example.com/ada.png', name: 'Ada Obi' });

    const image = native.querySelector('img.avatar-img') as HTMLImageElement | null;
    expect(image?.getAttribute('src')).toBe('https://example.com/ada.png');
    expect(native.querySelector('.avatar-initial')).toBeFalsy();
  });

  it('falls back to the initial when there is no picture URL', () => {
    const { native } = render({ src: null, name: 'Ada Obi' });

    expect(native.querySelector('img.avatar-img')).toBeFalsy();
    expect(native.querySelector('.avatar-initial')?.textContent).toContain('A');
  });

  it('falls back to the initial when the picture fails to load', () => {
    const { fixture, native } = render({ src: 'https://example.com/broken.png', name: 'Ada' });

    native.querySelector('img.avatar-img')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(native.querySelector('img.avatar-img')).toBeFalsy();
    expect(native.querySelector('.avatar-initial')?.textContent).toContain('A');
  });

  it('shows a placeholder mark when there is neither a picture nor a name', () => {
    const { native } = render({ src: null, name: null });

    expect(native.querySelector('.avatar-initial')?.textContent).toContain('?');
  });
});
