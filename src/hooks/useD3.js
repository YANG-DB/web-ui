import { useEffect, useRef } from "react";
import { select } from "d3";

export default function(cb, deps) {
  const ref = useRef(null);
  useEffect(() => {
    function paintD3() {
      cb(select(ref.current));
    }
    paintD3();
    window.addEventListener("resize", paintD3);
    return () => window.removeEventListener("resize", paintD3);
  }, [cb, deps]);
  return ref;
}
