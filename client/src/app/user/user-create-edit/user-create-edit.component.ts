import {Component, OnInit, ViewContainerRef} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UserService} from "app/user/shared/user.service";
import {User} from "app/user/shared/user.model";
import {NotificationService} from "app/shared/notification.service";
import {UtilityService} from "app/shared/utility.service";
import {ApiUrlService} from "app/shared/api-url.service";
import {Role} from "app/user/shared/role.model";
import {ActivatedRoute} from "@angular/router";
import {ValidationRules} from "../../shared/validation-rules.model";
import {ConfirmDialogService} from "app/shared/confirm-dialog.service";
import {Observable} from "rxjs/Observable";
import {ValidationService} from "../../shared/validation.service";
import {UserCreationLookupInfo} from "../shared/user-creation-lookup-info.model";
import {BaseUserCreationLookup} from "../shared/base-user-creation-lookup.model";

@Component({
  selector: 'c2s-user-create-edit',
  templateUrl: './user-create-edit.component.html',
  styleUrls: ['./user-create-edit.component.scss']
})
export class UserCreateEditComponent implements OnInit {
  private userId: number;
  private toSubmit: boolean = false;
  public createEditUserFrom: FormGroup;
  public editingUser: User;
  public isOpenOnFocus: boolean = true;
  public FORMAT: string = "MM/dd/y";
  public genders: BaseUserCreationLookup[];
  public locales: BaseUserCreationLookup[];
  public states: BaseUserCreationLookup[];
  public countries: BaseUserCreationLookup[];
  public roles: Role[];
  public isEditMode: boolean = false;
  public phoneErrorMessage: string = ValidationRules.PHONE_MESSAGE;
  public ssnErrorMessage: string = ValidationRules.SSN_MESSAGE;
  public zipErrorMessage: string = ValidationRules.ZIP_MESSAGE;
  public title: string = "Create User";
  public disabledRoles = [
    "parents",
    "guardian",
    "provider",
    "systemSupport",
    "staffUser"
  ];

  constructor(private apiUrlService: ApiUrlService,
              private confirmDialogService: ConfirmDialogService,
              private formBuilder: FormBuilder,
              private notificationService: NotificationService,
              private route: ActivatedRoute,
              private userService: UserService,
              private viewContainerRef: ViewContainerRef,
              private utilityService: UtilityService) {
  }

  ngOnInit() {
    let userCreationLookupInfo: UserCreationLookupInfo = this.route.snapshot.data['userCreationLookupInfo'];
    this.roles = userCreationLookupInfo.roles;
    this.genders = userCreationLookupInfo.genderCodes;
    this.locales = userCreationLookupInfo.locales;
    this.states = userCreationLookupInfo.stateCodes;
    this.countries = userCreationLookupInfo.countryCodes;
    this.createEditUserFrom = this.formBuilder.group({
      firstName: ['',
        [
          Validators.minLength(ValidationRules.NAME_MIN_LENGTH),
          Validators.maxLength(ValidationRules.NAME_MAX_LENGTH),
          Validators.required
        ]
      ],
      middleName: ['',
        [
          Validators.minLength(ValidationRules.NAME_MIN_LENGTH),
          Validators.maxLength(ValidationRules.NAME_MAX_LENGTH)
        ]
      ],
      lastName: ['',
        [
          Validators.minLength(ValidationRules.NAME_MIN_LENGTH),
          Validators.maxLength(ValidationRules.NAME_MAX_LENGTH),
          Validators.required
        ]
      ],
      homeEmail: ['', Validators.compose([
        Validators.required,
        Validators.email])
      ],
      genderCode: ['', Validators.required],
      birthDate: ['', Validators.compose([
        Validators.required,
        ValidationService.pastDateValidator])
      ],
      socialSecurityNumber: ['', Validators.pattern(ValidationRules.SSN_PATTERN)],
      homePhone: ['', Validators.pattern(ValidationRules.PHONE_PATTERN)],
      homeAddress: this.initAddressFormGroup(),
      roles: ['', Validators.required],
      locale: ['', Validators.required]
    });
    this.route.params
      .subscribe(
        params => {
          if (params['userId']) {
            // Edit mode
            this.title = "Edit User";
            let user: User = this.route.snapshot.data['user'];
            this.isEditMode = user.id != null;
            this.userId = user.id;
            this.editingUser = user;
            this.setValueOnEditUserForm(user);
          }
        });
  }

  private initAddressFormGroup() {
    return this.formBuilder.group({
      line1: ['', Validators.minLength(ValidationRules.NORMAL_MIN_LENGTH)],
      line2: ['', Validators.minLength(ValidationRules.NORMAL_MIN_LENGTH)],
      city: ['', Validators.minLength(ValidationRules.NORMAL_MIN_LENGTH)],
      stateCode: '',
      postalCode: ['', Validators.pattern(ValidationRules.ZIP_PATTERN)],
      countryCode: ''
    });
  }

  private setValueOnEditUserForm(user: User) {
    this.createEditUserFrom.setValue({
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      homeEmail: user.homeEmail,
      genderCode: user.genderCode,
      birthDate: user.birthDate,
      socialSecurityNumber: user.socialSecurityNumber,
      homePhone: user.homePhone,
      homeAddress: {
        line1: user.homeAddress.line1,
        line2: user.homeAddress.line2,
        city: user.homeAddress.city,
        stateCode: user.homeAddress.stateCode,
        postalCode: user.homeAddress.postalCode,
        countryCode: user.homeAddress.countryCode
      },
      roles: user.roles,
      locale: user.locale
    })
  }

  cancel(): void {
    this.utilityService.navigateTo(this.apiUrlService.getUserListUrl());
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.toSubmit) {
      return true;
    } else if (this.createEditUserFrom.dirty) {
      const confirmTitle: string = "Confirm Navigation";
      const confirmMessage: string = "You will lose all unsaved work, Are you sure you want to leave this page?";
      return this.confirmDialogService.confirm(confirmTitle, confirmMessage, this.viewContainerRef);
    } else {
      return true;
    }
  }

  createEditUser(): void {
    this.toSubmit = true;
    if (this.isEditMode) {
      this.userService.updateUser(this.userId, this.prepareCreateEditUser())
        .subscribe(
          () => {
            this.utilityService.navigateTo(this.apiUrlService.getUserListUrl())
          },
          err => {
            this.notificationService.show("Error in updating user.");
            console.log(err);
          }
        );
    } else {
      this.userService.createUser(this.prepareCreateEditUser())
        .subscribe(
          () => {
            this.utilityService.navigateTo(this.apiUrlService.getUserListUrl())
          },
          err => {
            this.notificationService.show("Error in creating user.");
            console.log(err);
          }
        );
    }
  }

  private prepareCreateEditUser(): User {
    const formModel = this.createEditUserFrom.value;
    return {
      firstName: formModel.firstName,
      middleName: formModel.middleName,
      lastName: formModel.lastName,
      homeEmail: formModel.homeEmail,
      birthDate: formModel.birthDate,
      genderCode: formModel.genderCode,
      socialSecurityNumber: formModel.socialSecurityNumber,
      homePhone: formModel.homePhone,
      homeAddress: formModel.homeAddress,
      roles: formModel.roles,
      locale: formModel.locale
    };
  }
}
