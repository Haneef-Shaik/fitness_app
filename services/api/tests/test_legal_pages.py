"""The DRAFT privacy policy and terms (K-10, launch).

Both stores want a privacy-policy URL; the app's About screen links here unless
the owner points it elsewhere. The texts are drafts, and the test that matters
most is the one that keeps saying so: a page with an undecided `[OWNER: …]`
marker is never served without the DRAFT banner.

The coverage checks are a floor, not a review. They catch the section that
quietly went missing — the AI provider, the age, the deletion link — not
whether the prose is right. That is counsel's job, and the banner says so.
"""
from __future__ import annotations

import re

import pytest

pytestmark = pytest.mark.asyncio

PAGES = ("/legal/privacy", "/legal/terms")


@pytest.mark.parametrize("path", PAGES)
async def test_it_is_a_plain_accessible_page(client, path):
    r = await client.get(path)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/html")
    html = r.text
    assert '<html lang="en">' in html
    assert 'name="viewport"' in html
    assert "<script" not in html.lower()
    assert len(re.findall(r"<h1>", html)) == 1
    assert r.headers["x-frame-options"] == "DENY"


@pytest.mark.parametrize("path", PAGES)
async def test_an_undecided_page_says_it_is_a_draft(client, path):
    html = (await client.get(path)).text
    if "[OWNER" in html:
        assert "DRAFT — must be reviewed by the owner/legal counsel before publishing" in html


@pytest.mark.parametrize("path", PAGES)
async def test_no_template_marker_leaks_through(client, path):
    assert "{{" not in (await client.get(path)).text


@pytest.mark.parametrize("path", PAGES)
async def test_the_contact_is_the_configured_address(client, path, monkeypatch):
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "support_email", "help@fitlog.example")
    html = (await client.get(path)).text
    assert 'href="mailto:help@fitlog.example"' in html


class TestThePrivacyPolicyCovers:
    @pytest.fixture
    async def text(self, client) -> str:
        return (await client.get("/legal/privacy")).text

    @pytest.mark.parametrize("subject", [
        # What is collected — every domain the export carries.
        "email address", "birth date, sex and height", "Workouts", "Nutrition",
        "Body metrics", "Progress photos", "Food photos", "meal descriptions", "Goals",
        # Who processes it.
        "Anthropic", "hosting provider", "file-storage provider", "crash-reporting",
        "email provider",
        # What the law and the stores ask for.
        "How long we keep it", "Delete your account", "16 and over", "Not medical advice",
        "special category", "use your data to train AI models", "EXIF",
    ])
    async def test_it_mentions(self, text, subject):
        assert subject.lower() in text.lower(), f"the privacy policy never mentions {subject!r}"

    async def test_it_links_to_the_web_deletion_page(self, text):
        # Google Play asks for this URL; the policy must lead to it. Relative
        # when no public address is configured, so it resolves against wherever
        # the page was actually served from.
        assert 'href="/account/delete"' in text

    async def test_the_public_address_is_configured_not_taken_from_the_request(
        self, client, monkeypatch
    ):
        """`Host` is the caller's to write, and the page is cached publicly: a
        link built from it could be pointed anywhere for everybody."""
        from app.config import get_settings

        forged = (await client.get("/legal/privacy", headers={"host": "evil.example"})).text
        assert "evil.example" not in forged

        monkeypatch.setattr(get_settings(), "public_base_url", "https://api.fitlog.example/")
        text = (await client.get("/legal/privacy")).text
        assert 'href="https://api.fitlog.example/account/delete"' in text

    async def test_it_names_where_to_delete_in_the_app(self, text):
        assert "Profile → Data and privacy → Delete my account" in text


class TestTheTermsCover:
    @pytest.fixture
    async def text(self, client) -> str:
        return (await client.get("/legal/terms")).text

    @pytest.mark.parametrize("subject", [
        "16 or older", "not a medical device", "estimate", "AI food analysis",
        "Your content", "Acceptable use", "delete your account",
    ])
    async def test_it_mentions(self, text, subject):
        assert subject.lower() in text.lower(), f"the terms never mention {subject!r}"

    async def test_it_links_to_the_privacy_policy(self, text):
        assert 'href="/legal/privacy"' in text
