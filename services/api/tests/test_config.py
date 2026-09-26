"""Startup rules: a deployed process refuses a configuration that would come up
healthy and then fail on real requests (app/config.py `validate`).

Staging is held to production's rules. It is where production's settings are
rehearsed, so a rule staging skipped would first be exercised on real users.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from app.config import Settings, validate

GOOD_SECRET = "x" * 48
S3 = {
    "storage_backend": "s3", "s3_bucket": "fitlog-photos", "s3_region": "eu-central-1",
    "s3_access_key_id": "key", "s3_secret_access_key": "secret",
}


def _deployed(environment: str = "production", **overrides) -> Settings:
    base = {
        "environment": environment, "jwt_secret": GOOD_SECRET,
        "upload_signing_secret": GOOD_SECRET, **S3,
        # The rest of a deployable configuration: the operator token and a
        # provider that really sends mail (both refused otherwise).
        "admin_token": "a" * 48, "email_provider": "resend",
        "email_api_key": "re_" + "k" * 30, "email_from": "FitLog <no-reply@fitlog.example>",
    }
    return Settings(_env_file=None, **{**base, **overrides})


@pytest.mark.parametrize("environment", ["staging", "production"])
class TestADeployedEnvironment:
    def test_a_complete_configuration_starts(self, environment):
        assert validate(_deployed(environment)).is_deployed

    def test_local_storage_is_refused(self, environment):
        # A container's disk is gone at the next deploy, and a second replica
        # never had it.
        with pytest.raises(RuntimeError, match="STORAGE_BACKEND must be s3"):
            validate(_deployed(environment, storage_backend="local"))

    def test_the_development_jwt_secret_is_refused(self, environment):
        with pytest.raises(RuntimeError, match="JWT_SECRET"):
            validate(_deployed(environment, jwt_secret="dev-only-change-me"))

    def test_the_development_upload_secret_is_refused(self, environment):
        with pytest.raises(RuntimeError, match="UPLOAD_SIGNING_SECRET"):
            validate(_deployed(environment, upload_signing_secret="dev-only-change-me"))


class TestS3Settings:
    @pytest.mark.parametrize("missing", [
        "s3_bucket", "s3_region", "s3_access_key_id", "s3_secret_access_key",
    ])
    def test_every_setting_a_bucket_needs_is_required(self, missing):
        # In ANY environment: STORAGE_BACKEND=s3 without a bucket fails on the
        # first upload otherwise, not at boot.
        settings = Settings(_env_file=None, **{**S3, missing: ""})

        with pytest.raises(RuntimeError, match=missing.upper()):
            validate(settings)

    def test_the_endpoint_is_optional_because_aws_needs_none(self):
        assert validate(Settings(_env_file=None, **S3)).s3_endpoint_url == ""

    def test_an_unknown_backend_is_refused_when_settings_load(self):
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            Settings(_env_file=None, storage_backend="gcs")


class TestDevelopment:
    def test_the_defaults_start_with_no_configuration_at_all(self):
        # `git clone` → `pytest` → run the app, with nothing to set (D23).
        settings = validate(Settings(_env_file=None))

        assert settings.storage_backend == "local"
        assert not settings.is_deployed
        assert settings.sentry_dsn == ""


class TestTheExampleFile:
    def test_every_setting_is_in_env_example(self):
        """The runbook's table and a new developer both start from this file,
        so a setting missing from it is a setting nobody knows to set."""
        example = Path(__file__).parents[1] / ".env.example"
        keys = {
            line.split("=", 1)[0].strip()
            for line in example.read_text().splitlines()
            if "=" in line and not line.lstrip().startswith("#")
        }

        missing = sorted(name.upper() for name in Settings.model_fields if name.upper() not in keys)
        assert missing == [], f"add to services/api/.env.example: {missing}"


class TestTheEnvironmentName:
    @pytest.mark.parametrize("name", ["Production", " production ", "STAGING"])
    def test_case_and_spacing_are_forgiven(self, name):
        assert Settings(_env_file=None, environment=name).environment == name.strip().lower()

    @pytest.mark.parametrize("name", ["prod", "production-eu", "live", ""])
    def test_an_unknown_name_refuses_to_start(self, name):
        # "prod" used to be neither development nor deployed: every production
        # rule was skipped and the dev JWT secret accepted (G11 review).
        from pydantic import ValidationError

        with pytest.raises(ValidationError, match="ENVIRONMENT must be one of"):
            Settings(_env_file=None, environment=name)
