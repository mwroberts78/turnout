export type RawClerkOrgEvent = {
  type: string;
  data: { id: string; name: string };
};

export type RawClerkOrgMembershipEvent = {
  type: string;
  data: {
    organization: {
      id: string;
    };
    role: string;
    public_user_data: {
      user_id: string;
      first_name: string;
      last_name: string;
      identifier: string;
    };
  };
};

export type RawClerkUserEvent = {
  type: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    primary_email_address_id: string;
    email_addresses: {
      email_address: string;
      id: string;
    }[];
  };
};

export type RawClerkUserDeleteEvent = {
  type: string;
  data: {
    id: string;
  };
};

export type RawClerkOrgDeleteEvent = {
  type: string;
  data: {
    id: string;
  };
};

export type WebhookHandlerResult =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: string };
