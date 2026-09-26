"""The handful of HTML pages the API serves to people rather than to the app.

Outside `/v1` and outside the OpenAPI document: they are pages, not endpoints,
and the generated client has no business knowing about them. They exist because
two store requirements need a URL that works with no app installed — Google
Play's account-deletion link and the privacy policy both stores ask for.
"""
