// event-bus.ts
import mitt, { Emitter } from "mitt";

type Events = {
  [propName: string]: any;
};

const emitter: Emitter<Events> = mitt<Events>();

export default emitter;
