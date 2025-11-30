import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import env from "@config/env";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(env("DEFAULT_TIMEZONE", "UTC"));

export default dayjs;
