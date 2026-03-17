import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  MapPin,
  Phone,
  Building,
  User,
  Mail,
  Briefcase,
} from "lucide-react";
import { saveSession, loadSession, clearSession, type PersistedSessionState } from "@/hooks/use-session-persistence";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WTCCoinLogo, WTCMainLogo, WTCFrame } from "@/components/wtc-branding";
import { useToast } from "@/hooks/use-toast";
import type { Volunteer, Zone, Business, StorefrontWithBusinesses } from "@/lib/types";
import {
  getAllZones,
  getStorefrontsByZone,
  getBusinessesByStorefrontId,
  createOrGetVolunteer,
  createCorrection,
  createCanvassingSession,
  updateCanvassingSessionStartTime,
  endCanvassingSession,
  createVolunteerSession,
} from "@/lib/supabase-storage";

// Business category options
const BUSINESS_CATEGORIES = [
  "(Community) Cultural Space",
  "(Community) Educational / Childcare",
  "(Community) Family Association",
  "(Community) Non Profit",
  "(Community) Religious",
  "(F&B) Bakery / Cafe",
  "(F&B) Bar / Nightlife",
  "(F&B) Restaurant [Full Service]",
  "(F&B) Takeout / Quick Service",
  "(Food Retail) Convenience Store / Bodega",
  "(Food Retail) Fresh Market",
  "(Food Retail) Specialty Store",
  "(Food Retail) Supermarket / Grocery",
  "(Food Retail) Wholesale",
  "(Retail) Clothing / Accessories",
  "(Retail) Gift / Souvenir Shops",
  "(Retail) Electronics / Appliances",
  "(Retail) Home Goods",
  "(Retail) Plumbing or Hardware Supplies",
  "(Retail) Other",
  "(Services) Financial Services",
  "(Services) Gallery",
  "(Services) Health & Wellness",
  "(Services) Laundry / Dry Cleaning",
  "(Services) Repair Shop",
  "(Services) Salon / Barber",
  "(Services) Travel & Shipping",
  "(Services) Entertainment",
  "(Services) Design, Print, or Fabrication",
  "(Other) Hotel / Hostel",
  "(Other) Office",
  "(Other) Parking",
  "(Other) Residential",
  "(Other) Unknown",
  "(Other) Vacant Storefront",
  "(Other) Vacant Lot",
];

const CATEGORY_GROUPS = BUSINESS_CATEGORIES.reduce<Record<string, { label: string; fullValue: string }[]>>((acc, cat) => {
  const match = cat.match(/^\(([^)]+)\)\s+(.+)$/);
  if (match) {
    const group = match[1];
    const sub = match[2];
    if (!acc[group]) acc[group] = [];
    acc[group].push({ label: sub, fullValue: cat });
  }
  return acc;
}, {});

export default function CanvassingApp() {
  const [currentStep, setCurrentStep] = useState<
    "welcome" | "zoneSelection" | "canvassing" | "complete"
  >("welcome");
  const [volunteerInfo, setVolunteerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
  });
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [currentZone, setCurrentZone] = useState<number | null>(null);
  const [currentStorefrontIndex, setCurrentStorefrontIndex] = useState(0);
  const [currentBusinessIndexWithinStorefront, setCurrentBusinessIndexWithinStorefront] = useState(0);
  const [corrections, setCorrections] = useState<Record<string, any>>({});
  const [correctionsCount, setCorrectionsCount] = useState(0);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [isAddingNewBusiness, setIsAddingNewBusiness] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [showIntermediateDialog, setShowIntermediateDialog] = useState(false);
  const [confirmedBusinessData, setConfirmedBusinessData] = useState<any>({});
  const [correctionFormData, setCorrectionFormData] = useState<any>({});
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string | null>(null);
  const [volunteerData, setVolunteerData] = useState<any>(null);
  const [internalSessionId, setInternalSessionId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionEndData, setSessionEndData] = useState<any>(null);
  const [sessionStartTimeSet, setSessionStartTimeSet] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [pendingResumeData, setPendingResumeData] = useState<PersistedSessionState | null>(null);

  // Check for saved session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.currentStep !== "welcome" && saved.currentStep !== "complete") {
      setPendingResumeData(saved);
      setShowResumeDialog(true);
    }
  }, []);

  // Auto-save session state on changes
  const persistState = useCallback(() => {
    if (currentStep === "welcome" || currentStep === "complete") return;
    saveSession({
      currentStep,
      volunteerInfo,
      selectedZones,
      currentZone,
      currentStorefrontIndex,
      currentBusinessIndexWithinStorefront,
      corrections,
      correctionsCount,
      progress,
      volunteerData,
      internalSessionId,
      sessionId,
      sessionStartTime: sessionStartTime?.toISOString() || null,
      sessionStartTimeSet,
    });
  }, [currentStep, volunteerInfo, selectedZones, currentZone, currentStorefrontIndex, currentBusinessIndexWithinStorefront, corrections, correctionsCount, progress, volunteerData, internalSessionId, sessionId, sessionStartTime, sessionStartTimeSet]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  const handleResumeSession = () => {
    if (!pendingResumeData) return;
    setCurrentStep(pendingResumeData.currentStep);
    setVolunteerInfo(pendingResumeData.volunteerInfo);
    setSelectedZones(pendingResumeData.selectedZones);
    setCurrentZone(pendingResumeData.currentZone);
    setCurrentStorefrontIndex(pendingResumeData.currentStorefrontIndex);
    setCurrentBusinessIndexWithinStorefront(pendingResumeData.currentBusinessIndexWithinStorefront);
    setCorrections(pendingResumeData.corrections);
    setCorrectionsCount(pendingResumeData.correctionsCount);
    setProgress(pendingResumeData.progress);
    setVolunteerData(pendingResumeData.volunteerData);
    setInternalSessionId(pendingResumeData.internalSessionId);
    setSessionId(pendingResumeData.sessionId);
    setSessionStartTime(pendingResumeData.sessionStartTime ? new Date(pendingResumeData.sessionStartTime) : null);
    setSessionStartTimeSet(pendingResumeData.sessionStartTimeSet);
    setShowResumeDialog(false);
    setPendingResumeData(null);
  };

  const handleStartFresh = () => {
    clearSession();
    setShowResumeDialog(false);
    setPendingResumeData(null);
  };

  const generateSessionLinkId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "session_";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const { toast } = useToast();

  // Fetch zones
  const { data: zones = [], isLoading: zonesLoading } = useQuery<Zone[]>({
    queryKey: ["zones"],
    queryFn: getAllZones,
    enabled: currentStep === "zoneSelection",
  });

  // Fetch storefronts for current zone
  const { data: storefronts = [], isLoading: storefrontsLoading } = useQuery<StorefrontWithBusinesses[]>({
    queryKey: ["storefronts", currentZone],
    queryFn: () => getStorefrontsByZone(currentZone!),
    enabled: currentZone !== null && currentStep === "canvassing",
  });

  const currentStorefrontId =
    storefronts[currentStorefrontIndex]?.id ||
    storefronts[currentStorefrontIndex]?.storefrontId;

  // Fetch businesses for the current storefront
  const { data: currentBusinesses = [], isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["businesses", currentStorefrontId],
    queryFn: () => getBusinessesByStorefrontId(currentStorefrontId!),
    enabled: currentStorefrontId !== undefined && currentStep === "canvassing",
  });

  // Update session start time when storefronts are loaded
  useEffect(() => {
    if (storefronts.length > 0 && currentStep === "canvassing" && internalSessionId && !sessionStartTimeSet) {
      const actualStartTime = new Date();
      setSessionStartTime(actualStartTime);
      setSessionStartTimeSet(true);
      updateCanvassingSessionStartTime(internalSessionId, actualStartTime.toISOString()).catch(console.error);
    }
  }, [storefronts, currentStep, internalSessionId, sessionStartTimeSet]);

  // Create volunteer mutation
  const createVolunteerMutation = useMutation({
    mutationFn: (data: typeof volunteerInfo) => createOrGetVolunteer(data),
    onSuccess: (volunteer: Volunteer) => {
      setVolunteerData(volunteer);
      setCurrentStep("zoneSelection");
      toast({ title: "Welcome!", description: "Your volunteer information has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save volunteer information.", variant: "destructive" });
    },
  });

  // Create correction mutation
  const createCorrectionMutation = useMutation({
    mutationFn: (correctionData: any) => createCorrection(correctionData),
    onSuccess: (data: any) => {
      const business = getCurrentBusiness();
      if (business) {
        setCorrections((prev) => ({ ...prev, [business.id]: data }));
      }
      setCorrectionsCount((prev) => prev + 1);
      const wasAddingNew = isAddingNewBusiness;
      toast({
        title: wasAddingNew ? "New Business Added" : "Correction Submitted",
        description: wasAddingNew ? "Your new business has been saved successfully." : "Your correction has been saved successfully.",
      });
      setShowCorrectionForm(false);
      setIsAddingNewBusiness(false);
      const currentBiz = getCurrentBusiness();
      setConfirmedBusinessData({
        businessName: correctionFormData.businessName || "",
        type: correctionFormData.type || "",
        publicBusiness: correctionFormData.publicBusiness || "",
        notes: correctionFormData.notes || "",
        initialEncounterMade: currentBiz?.initialEncounterMade || "",
      });
      setCorrectionFormData({});
      setSelectedCategoryGroup(null);
      setShowIntermediateDialog(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit correction.", variant: "destructive" });
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (sessionData: any) => createCanvassingSession(sessionData),
    onSuccess: (session: any) => {
      setInternalSessionId(session.id);
      setSessionStartTime(new Date(session.startTime || session.start_time));
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: (internalId: number) => endCanvassingSession(internalId),
    onSuccess: async (session: any) => {
      setSessionEndData(session);

      if (volunteerData && sessionStartTime) {
        const currentZoneData = zones.find((z) => z.id === currentZone);
        try {
          await createVolunteerSession({
            volunteerLinkId: volunteerData.volunteerLinkId || volunteerData.volunteer_link_id,
            sessionStartTime: sessionStartTime.toISOString(),
            sessionEndTime: session.endTime || session.end_time,
            zoneId: currentZone,
            zoneName: currentZoneData ? currentZoneData.name : `Zone ${currentZone}`,
            businessesVerified: progress.completed,
            correctionsMade: correctionsCount,
            sessionLinkId: sessionId!,
          });
        } catch (error) {
          console.error("Error saving volunteer session:", error);
        }
      }

      toast({ title: "Session Ended", description: "Canvassing session completed successfully." });
      setCurrentStep("complete");
    },
  });

  const totalBusinesses = storefronts.reduce((sum, sf) => sum + (sf.businesses?.length || 1), 0);

  useEffect(() => {
    if (storefronts.length > 0) {
      setProgress((prev) => ({ ...prev, total: totalBusinesses }));
    }
  }, [storefronts, totalBusinesses]);

  const handleVolunteerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerInfo.firstName.trim() || !volunteerInfo.lastName.trim() || !volunteerInfo.email.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createVolunteerMutation.mutate(volunteerInfo);
  };

  const handleZoneSelection = () => {
    if (selectedZones.length === 0) {
      toast({ title: "Error", description: "Please select at least one zone.", variant: "destructive" });
      return;
    }
    const linkId = generateSessionLinkId();
    setSessionId(linkId);
    createSessionMutation.mutate({ selectedZones: JSON.stringify(selectedZones), sessionLinkId: linkId, completed: false });
    const sortedZones = [...selectedZones].sort((a, b) => a - b);
    setCurrentZone(sortedZones[0]);
    setCurrentStorefrontIndex(0);
    setCurrentBusinessIndexWithinStorefront(0);
    setCurrentStep("canvassing");
  };

  const getCurrentStorefront = (): StorefrontWithBusinesses | null => {
    if (!currentZone || storefronts.length === 0) return null;
    return storefronts[currentStorefrontIndex] || null;
  };

  const getCurrentBusiness = (): Business | null => {
    if (currentBusinesses.length === 0) return null;
    return currentBusinesses[currentBusinessIndexWithinStorefront] || currentBusinesses[0];
  };

  const getBusinessPositionInfo = () => {
    if (currentBusinesses.length <= 1) return null;
    return { current: currentBusinessIndexWithinStorefront + 1, total: currentBusinesses.length };
  };

  const handleBusinessVerification = (isCorrect: boolean) => {
    if (isCorrect) {
      const business = getCurrentBusiness();
      setConfirmedBusinessData({
        businessName: business?.businessName || business?.business_name || "",
        type: business?.type || "",
        publicBusiness: business?.publicBusiness || business?.public_business || "",
        notes: business?.notes || "",
        initialEncounterMade: business?.initialEncounterMade || business?.initial_encounter_made || "",
      });
      setShowIntermediateDialog(true);
    } else {
      const storefront = getCurrentStorefront();
      const business = getCurrentBusiness();
      if (business && storefront) {
        let publicBusinessValue = "";
        const pb = business.publicBusiness || business.public_business || "";
        if (pb.includes("✅") || pb.toLowerCase().includes("yes")) publicBusinessValue = "Yes";
        else if (pb.includes("❌") || pb.toLowerCase().includes("no")) publicBusinessValue = "No";

        setCorrectionFormData({
          address: storefront.address || "",
          businessName: business.businessName || business.business_name || "",
          type: business.type || "",
          publicBusiness: publicBusinessValue,
          notes: business.notes || "",
        });
        setIsAddingNewBusiness(false);
        setShowCorrectionForm(true);
      }
    }
  };

  const handleAddNewBusiness = () => {
    const storefront = getCurrentStorefront();
    if (storefront) {
      setCorrectionFormData({ address: storefront.address || "", businessName: "", type: "", publicBusiness: "", notes: "" });
      setIsAddingNewBusiness(true);
      setShowCorrectionForm(true);
    }
  };

  const handleCorrectionSubmit = (correctionData: any) => {
    const storefront = getCurrentStorefront();
    const business = getCurrentBusiness();
    if (!volunteerData || !storefront) return;
    if (!isAddingNewBusiness && !business) return;
    if (!sessionId) {
      toast({ title: "Please wait", description: "Session is still being created.", variant: "destructive" });
      return;
    }

    let finalNotes = correctionData.notes || "";
    if (isAddingNewBusiness) {
      finalNotes = finalNotes ? `This is a new business. ${finalNotes}` : "This is a new business.";
    }

    const correctionEntry = {
      storefrontId: storefront.storefrontId || storefront.storefront_id,
      businessId: isAddingNewBusiness ? null : (business?.businessId || business?.business_id),
      sessionLinkId: sessionId,
      firstName: volunteerData.firstName || volunteerData.first_name,
      lastName: volunteerData.lastName || volunteerData.last_name,
      email: volunteerData.email,
      organization: volunteerData.organization || "",
      zoneId: currentZone,
      correctedBusinessName: correctionData.businessName || "",
      correctedType: correctionData.type || "",
      correctedPublicBusiness: correctionData.publicBusiness || "",
      correctedNotes: finalNotes,
    };

    createCorrectionMutation.mutate(correctionEntry);
  };

  const moveToNextBusiness = () => {
    if (storefronts.length === 0) return;
    if (currentBusinessIndexWithinStorefront < currentBusinesses.length - 1) {
      setCurrentBusinessIndexWithinStorefront(currentBusinessIndexWithinStorefront + 1);
    } else {
      if (currentStorefrontIndex < storefronts.length - 1) {
        setCurrentStorefrontIndex(currentStorefrontIndex + 1);
        setCurrentBusinessIndexWithinStorefront(0);
      } else {
        const sortedZones = [...selectedZones].sort((a, b) => a - b);
        const currentZoneIndex = sortedZones.indexOf(currentZone!);
        if (currentZoneIndex < sortedZones.length - 1) {
          setCurrentZone(sortedZones[currentZoneIndex + 1]);
          setCurrentStorefrontIndex(0);
          setCurrentBusinessIndexWithinStorefront(0);
        } else {
          if (internalSessionId) endSessionMutation.mutate(internalSessionId);
          else setCurrentStep("complete");
        }
      }
    }
    setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
  };

  const handleGoBack = () => {
    if (progress.completed === 0) return;
    if (currentBusinessIndexWithinStorefront > 0) {
      setCurrentBusinessIndexWithinStorefront(currentBusinessIndexWithinStorefront - 1);
    } else if (currentStorefrontIndex > 0) {
      setCurrentStorefrontIndex(currentStorefrontIndex - 1);
      setCurrentBusinessIndexWithinStorefront(0);
    } else {
      const sortedZones = [...selectedZones].sort((a, b) => a - b);
      const currentZoneIndex = sortedZones.indexOf(currentZone!);
      if (currentZoneIndex > 0) {
        setCurrentZone(sortedZones[currentZoneIndex - 1]);
        setCurrentStorefrontIndex(0);
        setCurrentBusinessIndexWithinStorefront(0);
      }
    }
    setProgress((prev) => ({ ...prev, completed: Math.max(0, prev.completed - 1) }));
  };

  // ==================== RENDER ====================

  if (showIntermediateDialog) {
    const storefront = getCurrentStorefront();
    const intermediateProgressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

    return (
      <div className="min-h-screen wtc-gradient-bg p-4">
        <div className="max-w-md mx-auto pt-4">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-yellow-200 mb-2">
              <span>Zone {currentZone}</span>
              <span>Location {currentStorefrontIndex + 1} of {storefronts.length}</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-3 shadow-inner">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-300 shadow-lg" style={{ width: `${intermediateProgressPercent}%` }}></div>
            </div>
          </div>

          <WTCFrame>
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Location Details</h2>
            <div className="space-y-4 mb-6">
              <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Address</div>
                  <div className="text-sm text-slate-500">{storefront?.address}</div>
                </div>
              </div>
              <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                <Building className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Business Name</div>
                  <div className="text-sm text-slate-500">{confirmedBusinessData.businessName || "N/A"}</div>
                </div>
              </div>
              <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                <Building className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Commercial Store Front Category</div>
                  <div className="text-sm text-slate-500">{confirmedBusinessData.type || "Unknown"}</div>
                </div>
              </div>
              <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                <div className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-lg">
                  {confirmedBusinessData.publicBusiness?.toLowerCase().includes("yes") || confirmedBusinessData.publicBusiness?.includes("✅") ? "✅" : "❌"}
                </div>
                <div>
                  <div className="font-medium text-slate-800">Public Business</div>
                  <div className="text-sm text-slate-500">{confirmedBusinessData.publicBusiness || "N/A"}</div>
                </div>
              </div>
              {confirmedBusinessData.notes && confirmedBusinessData.notes !== "–" && (
                <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                  <div className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-lg">📝</div>
                  <div>
                    <div className="font-medium text-slate-800">Notes</div>
                    <div className="text-sm text-slate-500">{confirmedBusinessData.notes}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button onClick={() => { setShowIntermediateDialog(false); handleAddNewBusiness(); }}
                className="w-full bg-gradient-to-r from-blue-900 to-blue-950 text-white py-3 px-4 rounded-md font-medium hover:from-blue-950 hover:to-slate-900 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                Add another business
              </button>
              {confirmedBusinessData.initialEncounterMade?.toLowerCase() !== "yes" && (
                <button onClick={() => {
                  const params = new URLSearchParams();
                  params.set("prefill_Address", storefront?.address || "");
                  params.set("prefill_Business Name", confirmedBusinessData.businessName || "");
                  window.open(`https://airtable.com/appQDpMa8IyBU0eST/pagQQQbuzVlGv5toT/form?${params.toString()}`, "_blank");
                }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-md font-medium hover:from-blue-600 hover:to-blue-700 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                  Fill out Initial Encounter Form
                </button>
              )}
              <button onClick={() => { setShowIntermediateDialog(false); moveToNextBusiness(); }}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-md font-medium hover:from-green-700 hover:to-green-800 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                Move to next location
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </WTCFrame>
        </div>
      </div>
    );
  }

  if (showCorrectionForm) {
    const business = getCurrentBusiness();
    if (!business) return <div>Loading...</div>;

    return (
      <div className="min-h-screen wtc-gradient-bg p-4">
        <div className="max-w-md mx-auto pt-4">
          <WTCFrame>
            <h2 className="text-lg font-semibold mb-4 text-slate-800">
              {isAddingNewBusiness ? "Add New Business" : "Correct Business Details"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-600">
                  {correctionFormData.address || "No address"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={correctionFormData.businessName || ""}
                  onFocus={() => setCorrectionFormData({ ...correctionFormData, businessName: "" })}
                  onChange={(e) => setCorrectionFormData({ ...correctionFormData, businessName: e.target.value })}
                  placeholder="Tap to enter business name..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commercial Store Front Category</label>
                {correctionFormData.type && (
                  <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <span className="text-sm text-slate-700 flex-1">{correctionFormData.type}</span>
                    <button type="button" className="text-xs text-red-500 hover:text-red-700 font-medium"
                      onClick={() => { setSelectedCategoryGroup(null); setCorrectionFormData({ ...correctionFormData, type: "" }); }}>
                      Change
                    </button>
                  </div>
                )}
                {!correctionFormData.type && !selectedCategoryGroup && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(CATEGORY_GROUPS).map((group) => (
                      <button key={group} type="button"
                        className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-yellow-50 hover:border-yellow-400 transition-colors"
                        onClick={() => setSelectedCategoryGroup(group)}>
                        {group}
                      </button>
                    ))}
                  </div>
                )}
                {!correctionFormData.type && selectedCategoryGroup && (
                  <div>
                    <button type="button" className="mb-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      onClick={() => setSelectedCategoryGroup(null)}>
                      ← Back to categories
                    </button>
                    <div className="text-xs font-medium text-slate-500 mb-1">{selectedCategoryGroup}</div>
                    <div className="flex flex-col gap-1">
                      {CATEGORY_GROUPS[selectedCategoryGroup]?.map((item) => (
                        <button key={item.fullValue} type="button"
                          className="px-3 py-2 text-sm text-left text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-yellow-50 hover:border-yellow-400 transition-colors"
                          onClick={() => { setCorrectionFormData({ ...correctionFormData, type: item.fullValue }); setSelectedCategoryGroup(null); }}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Public Business</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={correctionFormData.publicBusiness || ""}
                  onChange={(e) => setCorrectionFormData({ ...correctionFormData, publicBusiness: e.target.value })}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <p className="text-xs text-slate-500 mb-2">Share more details about the property</p>
                <textarea className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" rows={3}
                  value={correctionFormData.notes || ""}
                  onChange={(e) => setCorrectionFormData({ ...correctionFormData, notes: e.target.value })}
                  placeholder="Share more details about the property" />
              </div>
              <div className="flex space-x-4 pt-4">
                <button onClick={() => { setShowCorrectionForm(false); setIsAddingNewBusiness(false); setSelectedCategoryGroup(null); }}
                  className="flex-1 bg-gradient-to-r from-slate-400 to-slate-500 text-white py-3 px-4 rounded-md font-medium hover:from-slate-500 hover:to-slate-600 shadow-lg">
                  Cancel
                </button>
                <button onClick={() => handleCorrectionSubmit(correctionFormData)}
                  disabled={createCorrectionMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-md font-medium hover:from-red-600 hover:to-red-700 shadow-lg disabled:opacity-50">
                  {createCorrectionMutation.isPending ? "Submitting..." : isAddingNewBusiness ? "Submit New Business" : "Submit Corrections"}
                </button>
              </div>
            </div>
          </WTCFrame>
        </div>
      </div>
    );
  }

  if (currentStep === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center mb-8">
            <WTCMainLogo />
            <p className="text-yellow-100 text-sm mt-4">Canvassing Volunteer Portal</p>
          </div>
          <WTCFrame>
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Hello! Thanks for volunteering with Welcome to Chinatown.</h2>
            <p className="text-slate-600 mb-6">Fill out some quick details to get started.</p>
            <form onSubmit={handleVolunteerSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />First Name *
                  </label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    value={volunteerInfo.firstName} onChange={(e) => setVolunteerInfo({ ...volunteerInfo, firstName: e.target.value })}
                    placeholder="First name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />Last Name *
                  </label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    value={volunteerInfo.lastName} onChange={(e) => setVolunteerInfo({ ...volunteerInfo, lastName: e.target.value })}
                    placeholder="Last name" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />Email *
                </label>
                <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={volunteerInfo.email} onChange={(e) => setVolunteerInfo({ ...volunteerInfo, email: e.target.value })}
                  placeholder="your@email.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Briefcase className="w-4 h-4 inline mr-1" />Organization
                </label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={volunteerInfo.organization} onChange={(e) => setVolunteerInfo({ ...volunteerInfo, organization: e.target.value })}
                  placeholder="Organization (optional)" />
              </div>
              <button type="submit" disabled={createVolunteerMutation.isPending}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-md font-medium hover:from-red-600 hover:to-red-700 flex items-center justify-center disabled:opacity-50 shadow-lg transform transition-transform hover:scale-105">
                {createVolunteerMutation.isPending ? "Creating..." : "Get Started"}
                {!createVolunteerMutation.isPending && <ChevronRight className="w-4 h-4 ml-2" />}
              </button>
            </form>
          </WTCFrame>
          <div className="flex justify-center mt-8"><WTCCoinLogo /></div>
        </div>
      </div>
    );
  }

  if (currentStep === "zoneSelection") {
    return (
      <div className="min-h-screen wtc-gradient-bg p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center mb-6">
            <WTCCoinLogo size="small" />
            <h1 className="text-2xl font-bold text-yellow-300 mb-2 mt-4">Select Your Zones</h1>
          </div>
          <WTCFrame>
            <p className="text-slate-600 mb-4">What zone(s) have you been assigned?</p>
            {zonesLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                <p className="mt-2 text-slate-600">Loading zones...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {zones.map((zone) => (
                  <label key={zone.id} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors">
                    <input type="checkbox" className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                      checked={selectedZones.includes(zone.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedZones([...selectedZones, zone.id]);
                        else setSelectedZones(selectedZones.filter((z) => z !== zone.id));
                      }} />
                    <div>
                      <div className="font-medium text-slate-800">{zone.name}</div>
                      <div className="text-sm text-slate-500">{zone.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <button onClick={handleZoneSelection} disabled={selectedZones.length === 0 || zonesLoading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-md font-medium hover:from-red-600 hover:to-red-700 mt-6 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 disabled:opacity-50">
              Start Canvassing
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </WTCFrame>
        </div>
      </div>
    );
  }

  if (currentStep === "canvassing") {
    const storefront = getCurrentStorefront();
    const business = getCurrentBusiness();
    const businessPosition = getBusinessPositionInfo();

    if (storefrontsLoading || !storefront) {
      return (
        <div className="min-h-screen wtc-gradient-bg p-4">
          <div className="max-w-md mx-auto pt-8">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              <p className="mt-2 text-yellow-100">Loading locations...</p>
            </div>
          </div>
        </div>
      );
    }

    if (businessesLoading || !business) {
      return (
        <div className="min-h-screen wtc-gradient-bg p-4">
          <div className="max-w-md mx-auto pt-8">
            <div className="mb-6">
              <div className="flex justify-between text-sm text-yellow-200 mb-2">
                <span>Zone {currentZone}</span>
                <span>Location {currentStorefrontIndex + 1} of {storefronts.length}</span>
              </div>
            </div>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              <p className="mt-2 text-yellow-100">Loading business details...</p>
              <p className="text-xs text-yellow-200 mt-1">{storefront.address}</p>
            </div>
          </div>
        </div>
      );
    }

    const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

    return (
      <div className="min-h-screen wtc-gradient-bg p-4">
        <div className="max-w-md mx-auto pt-4">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-yellow-200 mb-2">
              <span>Zone {currentZone}</span>
              <div className="flex items-center space-x-2">
                {progress.completed > 0 && (
                  <button onClick={() => handleGoBack()}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded-md flex items-center transition-colors">
                    <ChevronLeft className="w-3 h-3 mr-1" />Back
                  </button>
                )}
                <span>Location {currentStorefrontIndex + 1} of {storefronts.length}</span>
              </div>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-3 shadow-inner">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-300 shadow-lg" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <WTCFrame>
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Are all details below correct?</h2>
            {businessPosition && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700 font-medium text-center">
                  Business {businessPosition.current} of {businessPosition.total} at this location
                </p>
              </div>
            )}
            <div className="space-y-4 mb-6">
              <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Address</div>
                  <div className="text-sm text-slate-500">{storefront.address}</div>
                  <div className="text-xs text-slate-400">ZIP: {storefront.zipCode || storefront.zip_code}</div>
                </div>
              </div>
              <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                <Building className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Business Name</div>
                  <div className="text-sm text-slate-500">{business.businessName || business.business_name}</div>
                </div>
              </div>
              <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                <Building className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">Commercial Store Front Category</div>
                  <div className="text-sm text-slate-500">{business.type || "Unknown"}</div>
                </div>
              </div>
              <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                <div className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-lg">
                  {(business.publicBusiness || business.public_business || "")?.includes("✅") ? "✅" : "❌"}
                </div>
                <div>
                  <div className="font-medium text-slate-800">Public Business</div>
                  <div className="text-sm text-slate-500">{business.publicBusiness || business.public_business}</div>
                </div>
              </div>
              {business.notes && business.notes !== "–" && (
                <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                  <div className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0 text-lg">📝</div>
                  <div>
                    <div className="font-medium text-slate-800">Notes</div>
                    <div className="text-sm text-slate-500">{business.notes}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button onClick={() => handleBusinessVerification(true)}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-md font-medium hover:from-green-700 hover:to-green-800 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                <Check className="w-5 h-5 mr-2" />Correct
              </button>
              <button onClick={() => handleBusinessVerification(false)}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-md font-medium hover:from-red-600 hover:to-red-700 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                <X className="w-5 h-5 mr-2" />Incorrect
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
              <p className="text-xs text-slate-500 text-center">Can't finish all businesses? Click below to end your session early.</p>
              <button onClick={() => internalSessionId && endSessionMutation.mutate(internalSessionId)}
                disabled={!internalSessionId || endSessionMutation.isPending}
                className="w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white py-2 px-4 rounded-md font-medium hover:from-slate-600 hover:to-slate-700 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 disabled:opacity-50">
                {endSessionMutation.isPending ? "Ending Session..." : "End Canvassing Now"}
              </button>
              <p className="text-xs text-slate-500 text-center">Need help? Reach out to us.</p>
              <button onClick={() => window.open("tel:+12028171356", "_self")}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2 px-4 rounded-md font-medium hover:from-yellow-600 hover:to-yellow-700 flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                <Phone className="w-4 h-4 mr-2" />Contact Welcome to Chinatown
              </button>
            </div>
          </WTCFrame>
        </div>
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen wtc-gradient-complete p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-yellow-300 mb-2">Canvassing Complete!</h1>
            <p className="text-green-100">Thank you for volunteering with Welcome to Chinatown</p>
          </div>
          <WTCFrame>
            <h2 className="text-lg font-semibold mb-4 text-slate-800">Session Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Volunteer:</span>
                <span className="font-medium text-slate-800">{volunteerInfo.firstName} {volunteerInfo.lastName}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Zones Completed:</span>
                <span className="font-medium text-slate-800">{selectedZones.join(", ")}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Businesses Verified:</span>
                <span className="font-medium text-slate-800">{progress.completed}</span>
              </div>
              {sessionEndData && (
                <>
                  {(sessionEndData.startTime || sessionEndData.start_time) && (
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600">Session Start:</span>
                      <span className="font-medium text-slate-800">
                        {new Date(sessionEndData.startTime || sessionEndData.start_time).toLocaleString("en-US", {
                          timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
                        })}{" "}EST
                      </span>
                    </div>
                  )}
                  {(sessionEndData.endTime || sessionEndData.end_time) && (
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-slate-600">Session End:</span>
                      <span className="font-medium text-slate-800">
                        {new Date(sessionEndData.endTime || sessionEndData.end_time).toLocaleString("en-US", {
                          timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
                        })}{" "}EST
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Corrections Submitted:</span>
                <span className="font-medium text-slate-800">{correctionsCount}</span>
              </div>
            </div>
            <button onClick={() => {
              setCurrentStep("welcome");
              setVolunteerInfo({ firstName: "", lastName: "", email: "", organization: "" });
              setSelectedZones([]);
              setCurrentZone(null);
              setCurrentStorefrontIndex(0);
              setCurrentBusinessIndexWithinStorefront(0);
              setCorrections({});
              setCorrectionsCount(0);
              setProgress({ completed: 0, total: 0 });
              setVolunteerData(null);
              setSessionId(null);
              setSessionStartTime(null);
              setSessionEndData(null);
              setSessionStartTimeSet(false);
              setShowCorrectionForm(false);
              setShowIntermediateDialog(false);
              setConfirmedBusinessData({});
              setCorrectionFormData({});
              setSelectedCategoryGroup(null);
            }}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-md font-medium hover:from-red-600 hover:to-red-700 mt-6 shadow-lg transform transition-transform hover:scale-105">
              Start New Session
            </button>
          </WTCFrame>
        </div>
      </div>
    );
  }

  return null;
}
