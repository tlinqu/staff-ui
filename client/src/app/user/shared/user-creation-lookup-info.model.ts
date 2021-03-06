import {Role} from "./role.model";
import {BaseUserCreationLookup} from "./base-user-creation-lookup.model";
import {IdentifierSystem} from "./IdentifierSystem.model";

export class UserCreationLookupInfo {
  public roles: Role[];
  public genderCodes: BaseUserCreationLookup[];
  public stateCodes: BaseUserCreationLookup[];
  public countryCodes: BaseUserCreationLookup[];
  public locales: BaseUserCreationLookup[];
  public identifierSystems: IdentifierSystem[];
}
