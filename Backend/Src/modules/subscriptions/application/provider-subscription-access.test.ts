import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { isProviderSubscriptionEligible } from "./provider-subscription-access.js";

const providerId = new Types.ObjectId();
const now = new Date("2026-11-19T00:00:00.000Z");

test("allows active paid subscription before paid-through date", () => {
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "active",
    paidThroughDate: new Date("2026-12-19T00:00:00.000Z"),
  }, now), true);
});

test("allows cancellation at period end until paid-through date", () => {
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "canceled",
    cancelAtPeriodEnd: true,
    paidThroughDate: new Date("2026-12-19T00:00:00.000Z"),
  }, now), true);
});

test("blocks canceled subscription after paid-through date", () => {
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "canceled",
    paidThroughDate: new Date("2026-11-18T00:00:00.000Z"),
  }, now), false);
});

test("blocks past due without a grace period", () => {
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "past_due",
    gracePeriodEnd: null,
  }, now), false);
});

test("allows past due only through an explicitly configured grace period", () => {
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "past_due",
    gracePeriodEnd: new Date("2026-11-20T00:00:00.000Z"),
  }, now), true);
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "past_due",
    gracePeriodEnd: new Date("2026-11-18T00:00:00.000Z"),
  }, now), false);
});

test("blocks unpaid and expired subscriptions", () => {
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "unpaid",
    gracePeriodEnd: new Date("2026-12-19T00:00:00.000Z"),
  }, now), false);
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "active",
    paidThroughDate: new Date("2026-11-18T00:00:00.000Z"),
  }, now), false);
});

test("allows trial only while trial end is future", () => {
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "trialing",
    trialEnd: new Date("2026-11-20T00:00:00.000Z"),
  }, now), true);
  assert.equal(isProviderSubscriptionEligible({
    providerId,
    status: "trialing",
    trialEnd: new Date("2026-11-18T00:00:00.000Z"),
  }, now), false);
});
