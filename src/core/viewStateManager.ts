import { GameState } from '@/types'

declare global {
  interface Document {
    mozFullScreenElement?: Element
    webkitFullscreenElement?: Element
    msFullscreenElement?: Element

    mozPointerLockElement?: Element
    webkitPointerLockElement?: Element

    mozExitPointerLock?: () => void
    webkitExitPointerLock?: () => void

    mozCancelFullScreen?: () => void
    webkitExitFullscreen?: () => void
    msExitFullscreen?: () => void
  }
  interface Element {
    mozRequestPointerLock?: () => void
    webkitRequestPointerLock?: () => void

    mozRequestFullScreen?: () => void
    webkitRequestFullscreen?: () => void
    msRequestFullscreen?: () => void
  }
}

export class ViewStateManager {
  constructor(private gameState: GameState) {}

  public handleFullscreenChange(): void {
    this.gameState.isFullscreen = !!(
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    )

    const fullscreenBtn = document.getElementById('fullscreen-btn')
    if (fullscreenBtn) {
      fullscreenBtn.textContent = this.gameState.isFullscreen ? 'Exit Full View' : 'Full View'
    }
  }

  public handlePointerLockChange(): void {
    this.gameState.isPointerLocked = !!(
      document.pointerLockElement === document.documentElement ||
      document.mozPointerLockElement === document.documentElement ||
      document.webkitPointerLockElement === document.documentElement
    )
  }

  public requestPointerLock(): void {
    const element = document.documentElement
    ;(element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock).call(element)
  }

  public exitPointerLock(): void {
    ;(document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock).call(document)
  }

  public updateFullscreenState(): void {
    if (this.gameState.isFullscreen) {
      const element = document.documentElement
      ;(
        element.requestFullscreen ||
        element.mozRequestFullScreen ||
        element.webkitRequestFullscreen ||
        element.msRequestFullscreen
      ).call(element)
    } else {
      ;(
        document.exitFullscreen ||
        document.mozCancelFullScreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen
      ).call(document)
    }
  }
}
