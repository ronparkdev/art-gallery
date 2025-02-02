export class VirtualJoystick {
  private joystickContainer: HTMLDivElement
  private joystickBase: HTMLDivElement
  private joystickStick: HTMLDivElement
  private isDragging = false
  private touchId: number | null = null
  private baseRect: DOMRect | null = null
  private onMove: (x: number, y: number) => void
  private basePos = { x: 0, y: 0 }
  private maxRadius = 40 // Maximum distance the stick can move from center

  constructor(onMove: (x: number, y: number) => void) {
    this.onMove = onMove
    this.joystickContainer = document.createElement('div')
    this.joystickBase = document.createElement('div')
    this.joystickStick = document.createElement('div')

    this.setupJoystickStyles()
    this.setupEventListeners()
  }

  private setupJoystickStyles(): void {
    // Container styles
    Object.assign(this.joystickContainer.style, {
      position: 'fixed',
      left: '50px',
      bottom: '50px',
      zIndex: '1000',
      display: 'none', // Initially hidden
      touchAction: 'none', // Prevent default touch actions
    })

    // Base styles
    Object.assign(this.joystickBase.style, {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      border: '2px solid rgba(255, 255, 255, 0.4)',
      position: 'relative',
      transform: 'translate(0, 0)',
    })

    // Stick styles
    Object.assign(this.joystickStick.style, {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      border: '2px solid rgba(255, 255, 255, 0.6)',
      position: 'absolute',
      left: '30px', // (120px - 60px) / 2
      top: '30px', // (120px - 60px) / 2
      transform: 'translate(0, 0)',
      cursor: 'pointer',
      transition: 'transform 0.1s ease-out',
    })

    this.joystickBase.appendChild(this.joystickStick)
    this.joystickContainer.appendChild(this.joystickBase)
    document.body.appendChild(this.joystickContainer)
  }

  private setupEventListeners(): void {
    this.joystickBase.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    document.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false })
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault()
    if (this.isDragging) return

    const touch = e.touches[0]
    this.touchId = touch.identifier
    this.isDragging = true
    this.baseRect = this.joystickBase.getBoundingClientRect()
    this.basePos = {
      x: this.baseRect.left + this.baseRect.width / 2,
      y: this.baseRect.top + this.baseRect.height / 2,
    }

    // Reset stick position
    this.updateStickPosition(touch.clientX, touch.clientY)
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDragging) return
    e.preventDefault()

    const touch = Array.from(e.touches).find(t => t.identifier === this.touchId)
    if (!touch || !this.baseRect) return

    this.updateStickPosition(touch.clientX, touch.clientY)
  }

  private updateStickPosition(clientX: number, clientY: number): void {
    // Calculate delta from center of base
    let deltaX = clientX - this.basePos.x
    let deltaY = clientY - this.basePos.y

    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // If distance is greater than maxRadius, normalize the delta values
    if (distance > this.maxRadius) {
      deltaX = (deltaX / distance) * this.maxRadius
      deltaY = (deltaY / distance) * this.maxRadius
    }

    // Update stick position
    this.joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`

    // Normalize values between -1 and 1 for movement
    const normalizedX = deltaX / this.maxRadius
    const normalizedY = deltaY / this.maxRadius
    this.onMove(normalizedX, normalizedY) // Invert Y for proper movement direction
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault()
    if (!this.isDragging) return

    const hadTouch = Array.from(e.touches).some(t => t.identifier === this.touchId)
    if (!hadTouch) {
      this.isDragging = false
      this.touchId = null
      this.baseRect = null

      // Reset stick position with animation
      this.joystickStick.style.transform = 'translate(0, 0)'
      this.onMove(0, 0)
    }
  }

  public getElement(): HTMLDivElement {
    return this.joystickContainer
  }

  public show(): void {
    this.joystickContainer.style.display = 'block'
  }

  public hide(): void {
    this.joystickContainer.style.display = 'none'
  }
}
