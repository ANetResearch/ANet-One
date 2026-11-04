export const CLI_COMMAND_NAME = "anet";
export const CLI_PROCESS_NAME = "anet-cli";

interface ProcessTitleTarget {
  title: string;
}

export const setCliProcessTitle = (
  target: ProcessTitleTarget = process,
): void => {
  target.title = CLI_PROCESS_NAME;
};
