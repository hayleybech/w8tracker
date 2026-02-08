<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWeightRecordRequest;
use App\Http\Requests\UpdateWeightRecordRequest;
use App\Models\WeightRecord;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class WeightRecordController extends Controller
{
    use AuthorizesRequests;

    public function store(StoreWeightRecordRequest $request): RedirectResponse
    {
        Auth::user()->weightRecords()->create($request->validated());

        return back()->with('success', 'Weight record added successfully.');
    }

    public function update(UpdateWeightRecordRequest $request, WeightRecord $weightRecord): RedirectResponse
    {
        $this->authorize('update', $weightRecord);

        $weightRecord->update($request->validated());

        return back()->with('success', 'Weight record updated successfully.');
    }

    public function destroy(WeightRecord $weightRecord): RedirectResponse
    {
        $this->authorize('delete', $weightRecord);

        $weightRecord->delete();

        return back()->with('success', 'Weight record deleted successfully.');
    }
}
