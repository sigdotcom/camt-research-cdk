import {
  IdentitystoreClient,
  UpdateUserCommand,
  CreateUserCommand,
  DeleteUserCommand,
  CreateGroupMembershipCommand,
  ListGroupsCommand,
  DeleteGroupMembershipCommand,
  ListGroupMembershipsForMemberCommand,
  GetGroupMembershipIdCommand,
} from "@aws-sdk/client-identitystore";

class IdentityStoreService {
  private client: IdentitystoreClient;
  private identityStoreId: string;

  constructor() {
    this.client = new IdentitystoreClient({});
    this.identityStoreId = "d-9067aafb7a";
  }

  async updateAWSUserPermissions(
    identityId: string,
    attributePath: string,
    attributeValue: any
  ) {
    const input = {
      IdentityStoreId: this.identityStoreId,
      UserId: identityId,
      Operations: [
        {
          AttributePath: attributePath,
          AttributeValue: attributeValue,
        },
      ],
    };

    try {
      const command = new UpdateUserCommand(input);
      return await this.client.send(command);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      throw error;
    }
  }

  async createUser(firstName: string, lastName: string, email: string) {
    const input = {
      IdentityStoreId: this.identityStoreId,
      UserName: email,
      Name: {
        FamilyName: lastName,
        GivenName: firstName,
        Formatted: `${firstName} ${lastName}`,
      },
      DisplayName: `${firstName} ${lastName}`,
      Emails: [
        {
          Primary: true,
          Type: "personal",
          Value: email,
        },
      ],
    };
    try {
      const command = new CreateUserCommand(input);
      const response = await this.client.send(command);
      return response;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async deleteUser(identityId: string) {
    const input = {
      IdentityStoreId: this.identityStoreId,
      UserId: identityId,
    };

    try {
      const command = new DeleteUserCommand(input);
      return await this.client.send(command);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async getCurrentGroup(userId: string) {
    const input = {
      IdentityStoreId: this.identityStoreId,
      MemberId: { UserId: userId },
      MaxResults: 1, // Since a user can only be in one group, we only need the first result
    };

    const command = new ListGroupMembershipsForMemberCommand(input);

    try {
      const response = await this.client.send(command);
      if (response.GroupMemberships && response.GroupMemberships.length > 0) {
        // Since users are only in one group, we can return the first one
        return response.GroupMemberships[0].GroupId;
      } else {
        // User is not in any groups
        return null;
      }
    } catch (error) {
      console.error("Error retrieving user's current group:", error);
      throw error;
    }
  }
  async assignGroup(userId: string, groupName: string): Promise<void> {
    const newGroupId = await this.getGroupId(groupName);
    if (!newGroupId) {
      throw new Error("New group not found");
    }

    const currentGroupId = await this.getCurrentGroup(userId);

    // If the user is already in the target group, no action is necessary
    if (currentGroupId === newGroupId) {
      return;
    }

    // If the user is in any group, remove them
    if (currentGroupId) {
      // Get the MembershipId
      const getMembershipIdCommand = new GetGroupMembershipIdCommand({
        IdentityStoreId: this.identityStoreId,
        GroupId: currentGroupId,
        MemberId: { UserId: userId },
      });

      let membershipId;
      try {
        const { MembershipId } = await this.client.send(getMembershipIdCommand);
        membershipId = MembershipId;
      } catch (error) {
        console.error("Error getting membership ID:", error);
        throw error;
      }

      const deleteCommand = new DeleteGroupMembershipCommand({
        IdentityStoreId: this.identityStoreId,
        MembershipId: membershipId,
      });

      try {
        await this.client.send(deleteCommand);
      } catch (error) {
        console.error("Error removing user from the old group:", error);
        throw error;
      }
    }

    // Add the user to the new group
    const createCommand = new CreateGroupMembershipCommand({
      IdentityStoreId: this.identityStoreId,
      GroupId: newGroupId,
      MemberId: { UserId: userId },
    });

    try {
      await this.client.send(createCommand);
    } catch (error) {
      console.error("Error assigning user to new group:", error);
      throw error;
    }
  }

  async getGroupId(groupName: string) {
    const input = {
      IdentityStoreId: this.identityStoreId,
      Filters: [
        {
          AttributePath: "DisplayName",
          AttributeValue: groupName,
        },
      ],
    };

    try {
      const command = new ListGroupsCommand(input);
      const response = await this.client.send(command);

      if (response.Groups && response.Groups.length > 0) {
        return response.Groups[0].GroupId;
      } else {
        throw new Error(`Group with name ${groupName} not found`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
}

export default IdentityStoreService;
