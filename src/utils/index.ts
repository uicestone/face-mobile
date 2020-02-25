import { vm } from "@/main";
import { ApolloError } from "apollo-client";

export const Message = ({ type = "txt", time = 1500, message }: { type?: string; time?: number; message: string }) =>
  vm
    .$createToast({
      type,
      time,
      txt: message
    })
    .show();

export const gqlErrorHanding = (func?: (err: ApolloError) => void) => (err: ApolloError) => {
  if (func) {
    return func(err);
  }
  return Message({ message: err.message });
};

export const loading = () => {
  const toast = vm.$createToast({
    time: 0
  });
  toast.show();
  return toast;
};
