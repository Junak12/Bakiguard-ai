import Swal from "sweetalert2";

/** Small non-blocking confirmation at the top of the screen. */
const Toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export function toastSuccess(message: string) {
  void Toast.fire({ icon: "success", title: message });
}

export function toastError(message: string) {
  void Toast.fire({ icon: "error", title: message });
}
