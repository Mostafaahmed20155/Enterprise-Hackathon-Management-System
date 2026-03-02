"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionType = exports.ResourceType = exports.RoleName = void 0;
var RoleName;
(function (RoleName) {
    RoleName["SUPER_ADMIN"] = "SUPER_ADMIN";
    RoleName["ORGANIZER"] = "ORGANIZER";
    RoleName["PARTICIPANT"] = "PARTICIPANT";
    RoleName["JUDGE"] = "JUDGE";
})(RoleName || (exports.RoleName = RoleName = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["EVENT"] = "EVENT";
    ResourceType["TEAM"] = "TEAM";
    ResourceType["SUBMISSION"] = "SUBMISSION";
    ResourceType["JUDGING"] = "JUDGING";
    ResourceType["USER"] = "USER";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ActionType;
(function (ActionType) {
    ActionType["CREATE"] = "CREATE";
    ActionType["READ"] = "READ";
    ActionType["UPDATE"] = "UPDATE";
    ActionType["DELETE"] = "DELETE";
    ActionType["PUBLISH"] = "PUBLISH";
    ActionType["ASSIGN"] = "ASSIGN";
    ActionType["SCORE"] = "SCORE";
})(ActionType || (exports.ActionType = ActionType = {}));
//# sourceMappingURL=user.js.map