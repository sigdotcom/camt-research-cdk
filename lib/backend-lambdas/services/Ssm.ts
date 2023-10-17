import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

class SSMService {
  private ssm: SSMClient;

  constructor() {
    this.ssm = new SSMClient();
  }

  async getParameter(parameterName: string) {
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    });

    const parameterResponse = await this.ssm.send(command);
    return parameterResponse.Parameter?.Value;
  }
}

export default SSMService;
