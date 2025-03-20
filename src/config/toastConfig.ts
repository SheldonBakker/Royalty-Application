export const toastConfig = {
  position: "top-center" as const,
  containerStyle: {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  toastOptions: {
    duration: 5000,
    style: {
      background: '#363636',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      maxWidth: '500px',
      minWidth: '300px'
    },
    error: {
      style: {
        background: '#DC2626',
        color: '#fff'
      }
    },
    success: {
      style: {
        background: '#059669',
        color: '#fff'
      }
    }
  }
}; 