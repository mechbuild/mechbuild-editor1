// auth/checkAccess.js

import { currentUser } from "./session.js";

export function checkAccess(command, projectOwner) {
  const isAdmin = currentUser.role === "admin";
  const isOwner = currentUser.username === projectOwner;

  // Admin her şeye erişebilir, mühendis sadece kendi projesine
  if (isAdmin || isOwner) {
    return true;
  } else {
    return false;
  }
}
