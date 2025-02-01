import { GameController } from './core/gameController'

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create fullscreen button if it doesn't exist
  if (!document.getElementById('fullscreen-btn')) {
    const fullscreenBtn = document.createElement('button')
    fullscreenBtn.id = 'fullscreen-btn'
    fullscreenBtn.textContent = 'Full View'
    fullscreenBtn.style.position = 'absolute'
    fullscreenBtn.style.top = '20px'
    fullscreenBtn.style.right = '20px'
    fullscreenBtn.style.zIndex = '1000'
    document.body.appendChild(fullscreenBtn)
  }

  // Initialize the game
  new GameController()
})
