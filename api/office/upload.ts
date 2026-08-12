import { handleOfficeUpload } from "../../server/office/handlers";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handleOfficeUpload;
