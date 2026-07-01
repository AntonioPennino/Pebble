export function handleTouchDrag(
    source: HTMLElement,
    touch: Touch,
    onDrop: (target: Element | null, x?: number, y?: number) => void
): void {
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.classList.add('ghost-drag'); // Use CSS class for styling
    ghost.style.width = `${source.offsetWidth}px`;
    ghost.style.height = `${source.offsetHeight}px`;
    ghost.style.opacity = '0.8';
    ghost.style.pointerEvents = 'none'; // Essential for elementFromPoint
    ghost.style.zIndex = '9999';
    document.body.appendChild(ghost);

    const updateGhost = (x: number, y: number) => {
        ghost.style.left = `${x - ghost.offsetWidth / 2}px`;
        ghost.style.top = `${y - ghost.offsetHeight / 2}px`;
    };
    updateGhost(touch.clientX, touch.clientY);

    const moveHandler = (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        const t = e.touches[0];
        updateGhost(t.clientX, t.clientY);
    };

    const endHandler = (e: TouchEvent) => {
        ghost.remove();
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('touchend', endHandler);

        // Check drop
        const changedTouch = e.changedTouches[0];
        const elementUnder = document.elementFromPoint(changedTouch.clientX, changedTouch.clientY);
        onDrop(elementUnder, changedTouch.clientX, changedTouch.clientY);
    };

    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
}
